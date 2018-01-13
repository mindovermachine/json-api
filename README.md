json-api [![CircleCI Badge](https://circleci.com/gh/ethanresnick/json-api.png?0d6d9ba9db7f15eb6363c6fd93408526bef06035&style=shield)](https://circleci.com/gh/ethanresnick/json-api) [![Coverage Status](https://coveralls.io/repos/ethanresnick/json-api/badge.svg?branch=master&service=github)](https://coveralls.io/github/ethanresnick/json-api?branch=master)
========

This library creates a [JSON API](http://jsonapi.org/)-compliant REST API from your Node app and automatically generates API documentation.

It currently integrates with [Express](http://expressjs.com/) or Koa apps that use [Mongoose](http://mongoosejs.com/) models, but it can easily be integrated with other frameworks and databases. If you want to see an integration with another stack, just open an issue!

This library implements all the required portions of the 1.0 spec, which is more than enough for basic CRUD. It does not yet implement some of the smaller, optional pieces, like related resource URIs.

# V3 Beta Installation
```$ npm install json-api@next```

# Example API
Check out the [full, working v3 example repo](https://github.com/ethanresnick/json-api-example/tree/v3-wip) for all the details on building an API with this library. Or, take a look at the basic example below:

```javascript
  var app = require('express')()
    , API = require('json-api');

  var models = {
    "Person": require('./models/person'),
    "Place": require('./models/place')
  };

  var adapter = new API.dbAdapters.Mongoose(models);
  var registry = new API.ResourceTypeRegistry({
    "people": {
      beforeRender: function(resource, req, res) {
        if(!userIsAdmin(req)) resource.removeAttr("password");
        return resource;
      }
    },
    "places": {}
  }, {
    "dbAdapter": adapter,
    "urlTemplates": { 
      "self": "/{type}/{id}"
    }
  });

  // Tell the lib the host name our API is served from; needed for security.
  const opts = { host: 'example.com' };

  // Set up a front controller, passing it controllers that'll be used
  // to handle requests for API resources and for the auto-generated docs.
  var Front = new API.httpStrategies.Express(
    new API.controllers.API(registry), 
    new API.controllers.Documentation(registry, {name: 'Example API'})
  );

  // Render the docs at /
  app.get("/", Front.docsRequest);

  // Add routes for basic list, read, create, update, delete operations
  app.get("/:type(people|places)", Front.apiRequest);
  app.get("/:type(people|places)/:id", Front.apiRequest);
  app.post("/:type(people|places)", Front.apiRequest);
  app.patch("/:type(people|places)/:id", Front.apiRequest);
  app.delete("/:type(people|places)/:id", Front.apiRequest);

  // Add routes for adding to, removing from, or updating resource relationships
  app.post("/:type(people|places)/:id/relationships/:relationship", Front.apiRequest);
  app.patch("/:type(people|places)/:id/relationships/:relationship", Front.apiRequest);
  app.delete("/:type(people|places)/:id/relationships/:relationship", Front.apiRequest);


  app.listen(3000);
  ```

# Core Concepts
## Resource Type Descriptions <a name="resource-type-descriptions"></a>
The JSON-API spec is built around the idea of typed resource collections. For example, you can have a `"people"` collection and a `"companies"` collection. (By convention, type names are plural, lowercase, and dasherized.)

To use this library, you describe the special behavior (if any) that resources of each type should have, and then register those descriptions with a central `ResourceTypeRegistry`. Then the library takes care of the rest. Each resource type description is simply an object with the following properties:

- `urlTemplates`: an object containing url templates used to output the json for resources of the type being described. Currently, the supported keys are: `"self"`, which defines the template used for building [resource urls](http://jsonapi.org/format/#document-structure-resource-urls) of that type, and `"relationship"`, which defines the template that will be used for [relationship urls](http://jsonapi.org/format/#fetching-relationships).
- `dbAdapter`: the [database adapter](#database-adapters) to use to find and update these resources. By specifying this for each resource type, different resource types can live in different kinds of databases.

- <a name="before-render"></a>`beforeRender` (optional): a function called on each resource after it's found by the adapter but before it's sent to the client. This lets you do things like hide fields that some users aren't authorized to see. [Usage details](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/people.js#L7).

- <a name="before-save"></a>`beforeSave` (optional): a function called on each resource provided by the client (i.e. in a `POST` or `PATCH` request) before it's sent to the adapter for saving. You can transform the data here as necessary or pre-emptively reject the request. [Usage details](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/people.js#L25).

- <a name="parentType"></a>`parentType` (optional): this allows you to designate one resource type being a sub-type of another (its `parentType`). This is often used when you have two resource types that live in the same database table/collection, and their type is determined with a discriminator key. See the [`schools` type](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/schools.js#L2) in the example repository. If a resource has a `parentType`, it inherits that type's configuration (i.e. its `urlTemplates`, `beforeSave`/`beforeRender` functions, `info`, etc), but can override those configuration settings too.

-  <a name="info"></a>`info` (optional): this allows you to provide extra information about the resource that will be included in the documentation. Available properties are `"description"` (a string describing what resources of this type are) and `"fields"`. `"fields"` holds an object in which you can describe each field in the resource (e.g. listing validation rules). See the [example implemenation](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/schools.js) for more details.

- <a name="transformLinkage">`transformLinkage` (optional): a boolean that, if true, will cause any resource identifier objects (i.e., the `{type, id}` pointer objects in each relationship) that have this type as their `type` to be passed to this type's `beforeRender`/`beforeSave` functions for transformation. Note that turning on `transformLinkage`, even for only one resource type, incurs a big performance cost. This may be optimized a bit in the future, but, fundamentally, transforming linkage is expensive because there can be many linkage items per relationship and each transform involves allocating a promise (as beforeRender and beforeSave can be async).

## Query Factories
When a request comes in, the json-api library extracts various parameters from it to build a query that will be used to fulfill the user's request.

However, to support advanced use cases, you might want to override how the library generates this query in order to select/update different data, or to modify how the query's result (data or error) is placed into the JSON:API response. To do this, you can just pass in your own function (a "query factory") for constructing this query. See an example [here](https://github.com/ethanresnick/json-api-example/blob/0d8d50c7e651dc099b4f5a89b7a9c47b8f7a4f32/src/index.js#L56).

One simple thing you can do with query factories is to create urls (or, in REST terminology, resources) that map to different database items over time. For example, you could have an `/events/upcoming` resource or a `/users/me` resource. To do that, your query factory function would call the library's built-in function to get its auto-generated query, and then modifiy that query (which would likely be for all the events and users respectively) to add a filter constraint that only returns the appropriate resources.

Query factory functions are also a good place to do permissions checks that rely on access to the parsed request body. If the user doesn't have permission, you can throw an error, and the library will pass it along gracefully in the response. See [error handling](#error-handling).

## Filtering
This library supports filtering out of the box, using a syntax that's designed to be easier to read, and much easier to write, than the  square brackets syntax used by libraries like [qs](https://github.com/ljharb/qs).

For example, to include only items where the zip code is either 90210 or 10012, you'd write: 

`?filter=(zip,in,(90210,10012))`. 

By contrast, with the square-bracket syntax you'd have to write something like: 

`?filter[zip][in][]=90210&filter[zip][in][]=10012`.

### Formatting filtering constraints
In this library's default format, the value of the `filter` parameter is one or more "filter constraints" listed next to each other. These constraints narrow the results to only include those that match. The format of a filter constraint is: `(fieldName,operator,value)`. For example:

- `(name,eq,Bob)`: only include items where the name equals Bob
- `(salary,gte,150000)`: only include items where the salary is greater than or equal to 150,000.

If the value given is an integer, a float, `null`, `true`, or `false`, it is treated as a literal; every other value is treated as a string. If you want to express a string like "true", you can explicitly put it in single quotes, e.g.: `(street,eq,'true')`. To define a list of values, surround the values in parentheses and separate them with commas (e.g. `(90210,10012)` is a list of values used with the `in` operator above).

The valid operators (for the buit-in Mongoose adapter) are: `eq`, `neq`, `in`, `nin`, `lt`, `gt`, `lte`, and `gte`.

If you have multiple constraints, you can choose whether to combine them with an `AND` or an `OR`. To do that, instead of providing three items in your field constraint (i.e., the field name, operator, and value), provide only two: 1) `and` or `or`, and 2) a list of constraints. E.g.:

`GET /people?filter=(or,((name,eq,Bob),(zip,eq,90210)))`

Will find all the people who are named Bob or who live in the 90210 zip code.

Filter constraints listed next to each other at the top-level are combined with an "AND". E.g., `GET /people?filter=(name,Bob)(zip,90210)` will give only the people named Bob who live in the 90210 zip code.

Finally, as a shorthand, when the field name is not `and` or `or`, and the operator you want is `eq` (for equals), you can omit the operator entirely. E.g. `(name,Bob)` expresses the same constraint as `(name,eq,Bob)`. 

Putting it all together, you could do:

`GET /people?filter=(or,((email,test@example.com)(name,Test)))(dob,gte,1963)`

This will find everyone born after 1963 who also has either the name "Test" or the email "test@example.com".

Note: this filter query paramer format is entirely cusomizable, and other operators can be used if your adapter supports them. See MongooseAdapter's static properties and the ResourceTypeRegistry's constructor for details.

### On URL Encoding
When the value that you want to use in a filter constraint contains parentheses, commas, or single quotation marks, you must URL encode those characters so that the server doesn't interpret them as delimiters. Conversely, when those characters do appear as delimiters (e.g., the parentheses that surround each filter constraint, or the comma that separates the field name from the operator), they must NOT be url encoded.

Some clients automatically encode parentheses, commas, and single quotation marks in url query strings by default. This is incorrect behavior [per RFC 3986](https://tools.ietf.org/html/rfc3986#section-2.2), and it will cause the server to error, because it won't see the appropriate (unescaped) delimiter characters. Check your client for a setting to turn this behavior off.

## Pagination
Pagination limit and offset parameters are accepted in the following form:
```
?page[offset]=<value>&page[limit]=<value>
```
For example, to get 25 people starting at the 51st person:
```
GET /people?page[offset]=50&page[limit]=25
```

## Error Handling
Code that you provide the library (e.g., a query factory function) can throw an error or, in some cases, return a promise that rejects with an error. 

Any time an `Error` is encountered, the library responds with a generic "An error has ocurred" response. The library doesn't pass any information from the error object (e.g., its message or stack trace) back to the client by default, as that could leak details about the server's implementation, which is not great for security.

If you want to pass information about the error back to the user, you need to explicitly mark it as safe to expose to the user, which you can do in two ways. First, you can throw an instance of the library's [`APIError` class](https://github.com/ethanresnick/json-api/blob/master/src/types/APIError.ts) directly, instead of a more general `Error`. (See the APIError constructor and the [json:api spec on errors](http://jsonapi.org/format/#errors) for details about what properties you can expose.) Second, if your error is coming from some existing code, you can attach a [special, Symbol-named property](https://github.com/ethanresnick/json-api/blob/d8bfaf0710e902d1e3ee7efba7e73aa2446788b5/src/types/APIError.ts#L22) to it with a truthy value, and that'll trigger the framework to know that it's safe to display.

Hope that helps! I'm going to close this thread, though, because neither @andrewbranch nor I are able to reproduce the original problem it was about (which is different then yours). Nevertheless, if my fix above doesn't work, feel free to add more comments here.

## Routing, Authentication & Controllers
This library gives you a Front controller (shown in the example) that can handle requests for API results or for the documentation. But the library doesn't prescribe how requests get to this controller. This allows you to use any url scheme, routing layer, or authentication system you already have in place. 

You just need to make sure that: `req.params.type` reflects the requested resource type; `req.params.id` reflects the requested id, if any; and `req.params.relationship` reflects the relationship name, in the event that the user is requesting a relationship url. The library will read these values to help it construct the query needed to fulfill the user's request.

The library may, in the future, also read `req.params.related` for related resource urls, so make sure you're not using that if you don't want the library to pick up it's value and use it in the query.

In the example above, routing is handled with Express's built-in `app[VERB]` methods, and the three parameters are set properly using express's built-in `:param` syntax. If you're looking for something more robust, you might be interested in [Express Simple Router](https://github.com/ethanresnick/express-simple-router). For authentication, check out [Express Simple Firewall](https://github.com/ethanresnick/express-simple-firewall).

## Database Adapters
An adapter handles all the interaction with the database. It is responsible for turning requests into standard [`Resource`](https://github.com/ethanresnick/json-api/blob/master/src/types/Resource.ts) or [`Collection`](https://github.com/ethanresnick/json-api/blob/master/src/types/Collection.ts) objects that the rest of the library will use. See the built-in [MongooseAdapter](https://github.com/ethanresnick/json-api/blob/master/src/db-adapters/Mongoose/MongooseAdapter.ts) for an example.
