// These functions really belong in a mixin, but well-typed mixins in
// Typescript are almost impossible when declaration: true.
// See, among other things, https://github.com/Microsoft/TypeScript/issues/15001
// So, we give up on that and just use a superclass instead.
// Also, we give up on using Immutable because its typing suck so we have to
// give up basically all type safety in order to use it.
import Query, { QueryOptions } from './Query';
import { FieldConstraint, Predicate, AndPredicate } from "../index";

export type WithCriteriaQueryOptions = QueryOptions & {
  limit?: number;
  offset?: number;
  singular?: boolean;
  filters?: (FieldConstraint | Predicate)[];
  idOrIds?: string | string[] | undefined;
};

export default class WithCriteriaQuery extends Query {
  protected query: Readonly<
    QueryOptions & {
    criteria: Readonly<{
      where: AndPredicate;
      singular: boolean;
      offset?: number;
      limit?: number;
    }>
   }>;

  constructor(opts: WithCriteriaQueryOptions) {
    super(opts);
    this.query = {
      ...this.query,
      criteria: {
        ...this.query.criteria,
        where: {
          operator: "and",
          value: [...(opts.filters || [])],
          field: undefined
        },
        singular: opts.singular || false,
        limit: opts.limit,
        offset: opts.offset
      }
    };

    if('idOrIds' in opts) {
      this.query = this.matchingIdOrIds(opts.idOrIds).query;
    }
  }

  /**
   * Adds a constraint to the top-level And predicate.
   * @param {FieldConstraint} constraint Constraint to add.
   */
  andWhere(constraint: FieldConstraint | Predicate) {
    // Criteria must always be an and predicate at the root level;
    // @see matchingIdOrIds
    if(this.query.criteria.where.operator !== 'and') {
      throw new Error("Where criteria is always an and predicate");
    }

    const res = this.clone();
    res.query = {
      ...res.query,
      criteria: {
        ...res.query.criteria,
        where: {
          ...res.query.criteria.where,
          value: [
            ...res.query.criteria.where.value,
            constraint
          ]
        }
      }
    }
    return res;
  }

  /**
   * This function adds criteria to the query to have it only match an id,
   * or list of ids (or the whole collection if undefined is passed in).
   * This function has a special role in preventing Mongo injection.
   * It always casts the ids to a string, and adds the criteria to the outer-
   * most and predicate in the where so it can't be overriden.
   * See https://thecodebarbarian.wordpress.com/2014/09/04/defending-against-query-selector-injection-attacks/
   *
   * @param {string | string[] | undefined = undefined} idOrIds [description]
   */
  matchingIdOrIds(idOrIds: WithCriteriaQueryOptions['idOrIds'] = undefined) {
    let res;

    if(Array.isArray(idOrIds)) {
      res = this.andWhere({
        field: "id",
        operator: "in",
        value: idOrIds.map(String)
      });

      res.query = {
        ...res.query,
        criteria: {
          ...res.query.criteria,
          singular: false
        }
      };
    }

    else if(typeof idOrIds === "string" && idOrIds) {
      res = this.andWhere({
        field: "id",
        operator: "eq",
        value: String(idOrIds)
      });

      res.query = {
        ...res.query,
        criteria: {
          ...res.query.criteria,
          singular: true
        }
      };
    }

    else {
      res = this.clone();
      res.query = {
        ...res.query,
        criteria: {
          ...res.query.criteria,
          singular: false
        }
      };
    }

    return res;
  }

  /**
   * Is the inverse of @see matchingIdOrIds.
   * (I.e., returns the value that was passed into that function.)
   */
  getIdOrIds(): string | string[] | undefined {
    const idRestrictions =
      this.query.criteria.where.value.filter(it => it.field === 'id');

    if(idRestrictions.length > 1) {
      throw new Error("Expected only one id criterion to be present.");
    }

    return idRestrictions[0]
      ? <string | string[]>idRestrictions[0].value
      : undefined;
  }

  getFilters(excludeIdFilters = false): AndPredicate {
    const rootFilterPredicate = this.query.criteria.where;
    return {
      ...rootFilterPredicate,
      value: excludeIdFilters
        ? rootFilterPredicate.value.filter(it => it.field !== 'id')
        : rootFilterPredicate.value
    };
  }

  get offset() {
    return this.query.criteria.offset;
  }

  get limit() {
    return this.query.criteria.limit;
  }
}