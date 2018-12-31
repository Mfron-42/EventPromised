'use strict';
var expect = require('chai').expect;
var EventPromised = require('../dist/index.js').default;
describe('events function test', () => {
    it('Should return the array of results', async () => {
        let results = [];
        await new EventPromised((resolve, error, emit ) => {
                emit ("A","blabla");
                emit ("B", 45);
                emit ("B", "skipped value");
                resolve(45);
            })
            .on("A", (res) => {
                results.push(res);
            })
            .once("B", (res) => {
                results.push(res);
            })
            .then((res) => {
                results.push(res);
            })
            .catch((res) => {
                results.push("error");
            })
            .then((res) => {
                results.push(res);
            })
            .then((res) => {
                results.push(res);
            })
            .then(() =>  new EventPromised((resolve) => resolve(5)))
            .then((res) => {
                results.push(res);
                throw "Error to be stored";
            })
            .then((res) => {
                results.push("should be skipped");
            })
            .catch((res) => {
                results.push("Error should be catched : " + res);
            })
            .then((res) => {
                results.push("should be stored");
            })
        expect(results).to.be.eql([
            "blabla", 
            45, 
            45,
            undefined, 
            undefined, 
            5,
            "Error should be catched : Error to be stored",
            "should be stored"
        ]);
    });
});