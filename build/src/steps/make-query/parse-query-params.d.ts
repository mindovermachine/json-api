import { Sort } from '../../types/index';
import { FieldConstraint, Predicate } from "../../types/index";
export declare type StringListParam = string[];
export declare type ScopedParam = {
    [scopeName: string]: any;
};
export declare type ScopedStringListParam = {
    [scopeName: string]: string[];
};
export declare type RawParams = {
    [paramName: string]: any;
};
export declare type ParsedQueryParams = {
    include?: StringListParam;
    sort?: Sort[];
    page?: ScopedParam;
    filter?: (FieldConstraint | Predicate)[];
    fields?: ScopedStringListParam;
};
export default function (params: RawParams): ParsedQueryParams;