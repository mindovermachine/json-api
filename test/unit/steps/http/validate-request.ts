import chai = require("chai");
import * as requestValidators from "../../../../src/steps/http/validate-request";

const {expect} = chai;

describe("Request Validation functions", () => {
  describe("checkBodyExistence", () => {
    it("should return a promise", () => {
      const res = requestValidators.checkBodyExistence({});
      expect(res instanceof Promise).to.be.true;
      res.catch(() => {}); // don't leave an unhandled rejection.
    });

    it("should return a rejected promise if a POST request is missing a body", (done) => {
      const contextMock = {hasBody: false, method: "post"};
      requestValidators.checkBodyExistence(contextMock).then(() => {
        done(new Error("This fulfillment handler shoudn't run"));
      }, () => { done(); });
    });

    it("should return a rejected promise if a PATCH request is missing a body", (done) => {
      const contextMock = {hasBody: false, method: "patch"};
      requestValidators.checkBodyExistence(contextMock).then(() => {
        done(new Error("This fulfillment handler shoudn't run"));
      }, () => {done(); });
    });

    it("should return a rejected promise if an unexpected body is present", (done) => {
      const contextMock = {hasBody: true, method: "get"};
      requestValidators.checkBodyExistence(contextMock).then(() => {
        done(new Error("This fulfillment handler shoudn't run"));
      }, () => { done(); });
    });

    it("should resolve the promise successfully when expected body is present", (done) => {
      const contextMock = {hasBody: true, method: "patch"};
      requestValidators.checkBodyExistence(contextMock)
        .then(() => { done() }, done);
    });

    it("should resolve the promise when body is expectedly absent", (done) => {
      const contextMock = {hasBody: false, needsBody: false};
      requestValidators.checkBodyExistence(contextMock)
        .then(() => { done() }, done);
    });
  });
});