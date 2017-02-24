'use strict';
var _ = require("lodash");
var bs = require("bookshelf");
var knex = require("knex");
var Mapper = require("../src/mapper");
describe('Bookshelf Adapter', function () {
    var bookshelf;
    var mapper;
    var domain = 'https://domain.com';
    beforeAll(function () {
        bookshelf = bs(knex({}));
        mapper = new Mapper.Bookshelf(domain);
    });
    afterAll(function (done) {
        bookshelf.knex.destroy(done);
    });
    it('should serialize a basic model', function () {
        var model = bookshelf.Model.forge({
            id: '5',
            name: 'A test model',
            description: 'something to use as a test'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: '5',
                type: 'models',
                attributes: {
                    name: 'A test model',
                    description: 'something to use as a test'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a basic model with custom id attribute', function () {
        var customModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = customModel.forge({
            email: 'foo@example.com',
            name: 'A test model',
            description: 'something to use as a test'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: 'foo@example.com',
                type: 'models',
                attributes: {
                    name: 'A test model',
                    description: 'something to use as a test'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize related model with custom id attribute in relationships object', function () {
        var customModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = bookshelf.Model.forge({
            id: 5,
            name: 'A test model',
            description: 'something to use as a test'
        });
        model.relations['related-model'] = customModel.forge({
            email: 'foo@example.com',
            attr2: 'value2'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                relationships: {
                    'related-model': {
                        data: {
                            id: 'foo@example.com',
                            type: 'related-models' // TODO check correct casing
                        },
                        links: {
                            self: domain + '/models/' + '5' + '/relationships/' + 'related-model',
                            related: domain + '/models/' + '5' + '/related-model'
                        }
                    }
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should include a repeated model only once in the included array', function () {
        var model = bookshelf.Model.forge({
            id: 5,
            name: 'A test model',
            description: 'something to use as a test'
        });
        var related = bookshelf.Model.forge({
            id: 4,
            attr: 'first value'
        });
        model.relations.relateds = bookshelf.Collection.forge([related]);
        model.relations.related = related;
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                relationships: {
                    'related': {
                        data: {
                            id: '4',
                            type: 'relateds'
                        }
                    },
                    'relateds': {
                        data: [
                            {
                                id: '4',
                                type: 'relateds'
                            }
                        ]
                    }
                }
            },
            included: [
                {
                    id: '4',
                    type: 'relateds',
                    attributes: {
                        attr: 'first value'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
        expect(result.included.length).toBe(1);
    });
    it('should serialize related model with custom id attribute in included array', function () {
        var customModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = bookshelf.Model.forge({
            id: 5,
            name: 'A test model',
            description: 'something to use as a test'
        });
        model.relations['related-model'] = customModel.forge({
            email: 'foo@example.com',
            attr2: 'value2'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            included: [
                {
                    id: 'foo@example.com',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value2'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a collection with custom id attribute', function () {
        var customModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model1 = customModel.forge({
            email: 'foo@example.com',
            name: 'A test model1',
            description: 'something to use as a test'
        });
        var collection = bookshelf.Collection.forge([model1]);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: [
                {
                    id: 'foo@example.com',
                    type: 'models',
                    attributes: {
                        name: 'A test model1',
                        description: 'something to use as a test'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a collection with custom id attribute within a related model on relationships object', function () {
        var customModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = bookshelf.Model.forge({
            id: 5,
            name: 'A test model',
            description: 'something to use as a test'
        });
        model.relations['related-model'] = customModel.forge({
            email: 'foo@example.com',
            attr2: 'value2'
        });
        var collection = bookshelf.Collection.forge([model]);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: [
                {
                    type: 'models',
                    id: '5',
                    attributes: {
                        name: 'A test model',
                        description: 'something to use as a test'
                    },
                    links: { self: domain + '/models/5' },
                    relationships: {
                        'related-model': {
                            data: { id: 'foo@example.com', type: 'related-models' },
                            links: {
                                self: domain + '/models/5/relationships/related-model',
                                related: domain + '/models/5/related-model'
                            }
                        }
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a collection with custom id attribute within a related model on included array', function () {
        var customModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = bookshelf.Model.forge({
            id: 5,
            name: 'A test model',
            description: 'something to use as a test'
        });
        model.relations['related-model'] = customModel.forge({
            email: 'foo@example.com',
            attr2: 'value2'
        });
        var collection = bookshelf.Collection.forge([model]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    type: 'related-models',
                    id: 'foo@example.com',
                    attributes: {
                        attr2: 'value2'
                    },
                    links: { self: domain + '/related-models/foo@example.com' }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize null or undefined data', function () {
        var result1 = mapper.map(undefined, 'models');
        var result2 = mapper.map(null, 'models');
        var expected = {
            data: null
        };
        expect(_.matches(expected)(result1)).toBe(true);
        expect(_.matches(expected)(result2)).toBe(true);
    });
    it('should omit the model idAttribute from the attributes', function () {
        var customModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = customModel.forge({
            email: 'foo@example.com',
            name: 'A test model',
            description: 'something to use as a test'
        });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: 'foo@example.com',
                type: 'models',
                attributes: {
                    name: 'A test model',
                    description: 'something to use as a test'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
        expect(_.has(result.data.attributes, 'email')).toBe(false);
    });
    it('should omit attributes that match regexes passed by the user', function () {
        var model = bookshelf.Model.forge({
            id: '4',
            attr: 'value',
            paid: true,
            'related-id': 123,
            'another_id': '456',
            'someId': '890'
        });
        var result = mapper.map(model, 'models', { omitAttrs: [/^id$/, /[_-]id$/, /Id$/] });
        var expected = {
            data: {
                id: '4',
                type: 'models',
                attributes: {
                    attr: 'value',
                    paid: true
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
        expect(_.isEqual(result.data.attributes, expected.data.attributes)).toBe(true);
    });
    it('should omit attributes that exactly equal strings passed by the user', function () {
        var model = bookshelf.Model.forge({
            id: '4',
            attr: 'value',
            'to-omit': true,
            'not-to-omit': false,
            ids: [4, 5, 6]
        });
        var result = mapper.map(model, 'models', { omitAttrs: ['id', 'to-omit'] });
        var expected = {
            data: {
                id: '4',
                type: 'models',
                attributes: {
                    attr: 'value',
                    'not-to-omit': false,
                    ids: [4, 5, 6]
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
        expect(_.isEqual(result.data.attributes, expected.data.attributes)).toBe(true);
    });
    it('should stop omitting attributes that would be omitted', function () {
        var customModel = bookshelf.Model.extend({
            idAttribute: 'email'
        });
        var model = customModel.forge({
            email: 'email@example.com'
        });
        var result1 = mapper.map(model, 'models', { omitAttrs: [] });
        var result2 = mapper.map(model, 'models', { omitAttrs: null });
        var expected = {
            data: {
                id: 'email@example.com',
                type: 'models',
                attributes: {
                    email: 'email@example.com'
                }
            }
        };
        expect(_.isMatch(result1, expected)).toBe(true);
        expect(_.isMatch(result2, expected)).toBe(true);
        expect(_.isEqual(result1.data.attributes, expected.data.attributes)).toBe(true);
        expect(_.isEqual(result2.data.attributes, expected.data.attributes)).toBe(true);
    });
    it('should serialize an empty collection', function () {
        var collection = bookshelf.Collection.forge();
        var result = mapper.map(collection, 'models');
        var expected = {
            data: []
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should serialize a collection', function () {
        var elements = _.range(5).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: _.range(5).map(function (num) {
                return {
                    id: num.toString(),
                    type: 'models',
                    attributes: {
                        attr: 'value' + num
                    }
                };
            })
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
});
describe('Bookshelf links', function () {
    var bookshelf;
    var mapper;
    var domain = 'https://domain.com';
    beforeAll(function () {
        bookshelf = bs(knex({}));
        mapper = new Mapper.Bookshelf(domain);
    });
    afterAll(function (done) {
        bookshelf.knex.destroy(done);
    });
    it('should add top level links', function () {
        var model = bookshelf.Model.forge({ id: '10' });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: '10',
                type: 'models'
            },
            links: {
                self: domain + '/models'
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add top level links for a collection', function () {
        var model1 = bookshelf.Model.forge({ id: '5' });
        var model2 = bookshelf.Model.forge({ id: '6' });
        var collection = bookshelf.Collection.forge([model1, model2]);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: [{
                    id: '5',
                    type: 'models'
                },
                {
                    id: '6',
                    type: 'models'
                }],
            links: {
                self: domain + '/models'
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add primary data links', function () {
        var model = bookshelf.Model.forge({ id: '5' });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                id: '5',
                type: 'models',
                links: {
                    self: domain + '/models' + '/5'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add primary data links for a collection', function () {
        var model1 = bookshelf.Model.forge({ id: '5' });
        var model2 = bookshelf.Model.forge({ id: '6' });
        var collection = bookshelf.Collection.forge([model1, model2]);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: [{
                    id: '5',
                    type: 'models',
                    links: {
                        self: domain + '/models' + '/5'
                    }
                },
                {
                    id: '6',
                    type: 'models',
                    links: {
                        self: domain + '/models' + '/6'
                    }
                }]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add related links', function () {
        var model = bookshelf.Model.forge({ id: '5' });
        model.relations['related-model'] = bookshelf.Model.forge({ id: '10' });
        var result = mapper.map(model, 'models');
        var expected = {
            data: {
                relationships: {
                    'related-model': {
                        data: {
                            id: '10',
                            type: 'related-models' // TODO check correct casing
                        },
                        links: {
                            self: domain + '/models/' + '5' + '/relationships/' + 'related-model',
                            related: domain + '/models/' + '5' + '/related-model'
                        }
                    }
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add related links for nested relationships', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        var model3 = bookshelf.Model.forge({ id: '7', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-model'] = model3;
        var result = mapper.map(model1, 'models');
        var expected = {
            data: {
                relationships: {
                    'related-model': {
                        data: {
                            type: 'related-models',
                            id: '6'
                        }
                    }
                }
            },
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-model': {
                            data: {
                                type: 'nested-related-models',
                                id: '7'
                            },
                            links: {
                                self: domain + "/related-models/6/relationships/nested-related-model",
                                related: domain + "/related-models/6/nested-related-model"
                            }
                        }
                    }
                },
                {
                    id: '7',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add related links for nested relationships within a collection', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr: 'value' }),
            bookshelf.Model.forge({ id: '11', attr: 'value' })
        ]);
        var collection = bookshelf.Collection.forge([model1]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-models': {
                            data: [{
                                    type: 'nested-related-models',
                                    id: '10'
                                }, {
                                    type: 'nested-related-models',
                                    id: '11'
                                }],
                            links: {
                                self: domain + "/related-models/6/relationships/nested-related-models",
                                related: domain + "/related-models/6/nested-related-models"
                            }
                        }
                    }
                },
                {
                    id: '10',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                },
                {
                    id: '11',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ],
            data: [{
                    relationships: {
                        'related-model': {
                            data: {
                                type: 'related-models',
                                id: '6'
                            }
                        }
                    }
                }]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should add pagination links', function () {
        var limit = 10;
        var offset = 40;
        var total = 100;
        var elements = _.range(10).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models', {
            pagination: { limit: limit, offset: offset, total: total }
        });
        var expected = {
            links: {
                first: domain + '/models?page[limit]=10&page[offset]=0',
                prev: domain + '/models?page[limit]=10&page[offset]=30',
                next: domain + '/models?page[limit]=10&page[offset]=50',
                last: domain + '/models?page[limit]=10&page[offset]=90'
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should not add pagination links if no pagination data is passed', function () {
        var elements = _.range(10).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models');
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).not.toContain('prev');
        expect(Object.keys(result.links)).not.toContain('first');
        expect(Object.keys(result.links)).not.toContain('next');
        expect(Object.keys(result.links)).not.toContain('last');
    });
    it('should support bookshelf\'s new `rowCount` property passed by `Model#fetchPage`', function () {
        var limit = 10;
        var offset = 40;
        var total = 100;
        var elements = _.range(10).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models', {
            pagination: { limit: limit, offset: offset, rowCount: total }
        });
        var expected = {
            links: {
                first: domain + '/models?page[limit]=' + limit + '&page[offset]=' + 0,
                prev: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (offset - limit),
                next: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (offset + limit),
                last: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (total - limit)
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should omit `first` and `prev` pagination links if offset = 0', function () {
        var limit = 5;
        var offset = 0;
        var total = 10;
        var collection = bookshelf.Collection.forge([]);
        var result = mapper.map(collection, 'models', {
            pagination: { limit: limit, offset: offset, total: total }
        });
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).not.toContain('first');
        expect(Object.keys(result.links)).not.toContain('prev');
        expect(Object.keys(result.links)).toContain('next');
        expect(Object.keys(result.links)).toContain('last');
    });
    it('should omit `next` and `last` pagination links if at last page', function () {
        var limit = 5;
        var offset = 5;
        var total = 10;
        var collection = bookshelf.Collection.forge([]);
        var result = mapper.map(collection, 'models', {
            pagination: { limit: limit, offset: offset, total: total }
        });
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).toContain('first');
        expect(Object.keys(result.links)).toContain('prev');
        expect(Object.keys(result.links)).not.toContain('next');
        expect(Object.keys(result.links)).not.toContain('last');
    });
    it('should not add pagination links if collection is empty', function () {
        var limit = 10;
        var offset = 40;
        var total = 0;
        var collection = bookshelf.Collection.forge([]);
        var result = mapper.map(collection, 'models', {
            pagination: { limit: limit, offset: offset, total: total }
        });
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).not.toContain('prev');
        expect(Object.keys(result.links)).not.toContain('first');
        expect(Object.keys(result.links)).not.toContain('next');
        expect(Object.keys(result.links)).not.toContain('last');
    });
    it('should not add pagination links if total <= limit', function () {
        var limit = 10;
        var offset = 0;
        var total = 5;
        var elements = _.range(total).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models', {
            pagination: { limit: limit, offset: offset, total: total }
        });
        expect(result.links).toBeDefined();
        expect(Object.keys(result.links)).not.toContain('prev');
        expect(Object.keys(result.links)).not.toContain('first');
        expect(Object.keys(result.links)).not.toContain('next');
        expect(Object.keys(result.links)).not.toContain('last');
    });
    it('should not overlap last page with the penultimate page', function () {
        var limit = 3;
        var offset = 3;
        var total = 10;
        var elements = _.range(10).map(function (num) {
            return bookshelf.Model.forge({ id: num, attr: 'value' + num });
        });
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models', {
            pagination: { limit: limit, offset: offset, total: total }
        });
        var expected = {
            links: {
                next: domain + '/models?page[limit]=' + 3 + '&page[offset]=' + 6,
                last: domain + '/models?page[limit]=' + 1 + '&page[offset]=' + 9
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should not serialize links when `enableLinks: false`', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr: 'value' })
        ]);
        var collection = bookshelf.Collection.forge([model1]);
        var result = mapper.map(collection, 'models', { enableLinks: false });
        expect(result.links).not.toBeDefined();
        expect(result.data[0].relationships['related-model'].links).not.toBeDefined();
        expect(result.included[0].links).not.toBeDefined();
        expect(result.included[1].links).not.toBeDefined();
    });
});
describe('Bookshelf relations', function () {
    var bookshelf;
    var mapper;
    var domain = 'https://domain.com';
    beforeAll(function () {
        bookshelf = bs(knex({}));
        mapper = new Mapper.Bookshelf(domain);
    });
    afterAll(function (done) {
        bookshelf.knex.destroy(done);
    });
    it('should add relationships object', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-model'] = bookshelf.Model.forge({ id: '10', attr2: 'value2' });
        model.relations['related-model']
            .relations['inner-related-model'] = bookshelf.Model.forge({ id: '20', attr3: 'value3' });
        var result = mapper.map(model, 'model');
        var expected = {
            data: {
                id: '5',
                type: 'models',
                attributes: {
                    attr: 'value'
                },
                relationships: {
                    'related-model': {
                        data: {
                            id: '10',
                            type: 'related-models'
                        }
                    }
                }
            },
            included: [
                {
                    type: 'related-models',
                    id: '10',
                    attributes: {
                        attr2: 'value2'
                    },
                    relationships: {
                        'inner-related-model': {
                            data: {
                                id: '20',
                                type: 'inner-related-models'
                            }
                        }
                    }
                },
                {
                    type: 'inner-related-models',
                    id: '20',
                    attributes: {
                        attr3: 'value3'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should put the single related object in the included array', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-model'] = bookshelf.Model.forge({ id: '10', attr2: 'value2' });
        var result = mapper.map(model, 'models');
        var expected = {
            included: [
                {
                    id: '10',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value2'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should return empty array when collection is empty', function () {
        var collection = bookshelf.Collection.forge([]);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: []
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should put the array of related objects in the included array', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model1.relations['related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr2: 'value20' }),
            bookshelf.Model.forge({ id: '11', attr2: 'value21' })
        ]);
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model2.relations['related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '12', attr2: 'value22' }),
            bookshelf.Model.forge({ id: '13', attr2: 'value23' })
        ]);
        var collection = bookshelf.Collection.forge([model1, model2]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '10',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value20'
                    }
                },
                {
                    id: '11',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value21'
                    }
                },
                {
                    id: '12',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value22'
                    }
                },
                {
                    id: '13',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value23'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should put the array of related objects in the included array with same related', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model1.relations['related1-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr2: 'value20' }),
            bookshelf.Model.forge({ id: '11', attr2: 'value21' })
        ]);
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model2.relations['related1-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '11', attr2: 'value21' }),
            bookshelf.Model.forge({ id: '12', attr2: 'value22' })
        ]);
        var collection = bookshelf.Collection.forge([model1, model2]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '10',
                    type: 'related1-models',
                    attributes: {
                        attr2: 'value20'
                    }
                },
                {
                    id: '11',
                    type: 'related1-models',
                    attributes: {
                        attr2: 'value21'
                    }
                },
                {
                    id: '12',
                    type: 'related1-models',
                    attributes: {
                        attr2: 'value22'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should put the array of related objects in the included array with different related', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model1.relations['related1-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr2: 'value20' }),
            bookshelf.Model.forge({ id: '11', attr2: 'value21' })
        ]);
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model2.relations['related2-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '12', attr2: 'value22' }),
            bookshelf.Model.forge({ id: '13', attr2: 'value23' })
        ]);
        var model3 = bookshelf.Model.forge({ id: '7', attr: 'value' });
        model3.relations['related2-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '13', attr2: 'value23' }),
            bookshelf.Model.forge({ id: '14', attr2: 'value24' })
        ]);
        var collection = bookshelf.Collection.forge([model1, model2, model3]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '10',
                    type: 'related1-models',
                    attributes: {
                        attr2: 'value20'
                    }
                },
                {
                    id: '11',
                    type: 'related1-models',
                    attributes: {
                        attr2: 'value21'
                    }
                },
                {
                    id: '12',
                    type: 'related2-models',
                    attributes: {
                        attr2: 'value22'
                    }
                },
                {
                    id: '13',
                    type: 'related2-models',
                    attributes: {
                        attr2: 'value23'
                    }
                },
                {
                    id: '14',
                    type: 'related2-models',
                    attributes: {
                        attr2: 'value24'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should support including nested relationships', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        var model3 = bookshelf.Model.forge({ id: '7', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-model'] = model3;
        var result = mapper.map(model1, 'models');
        var expected = {
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-model': {
                            data: {
                                type: 'nested-related-models',
                                id: '7'
                            }
                        }
                    }
                },
                {
                    id: '7',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ],
            data: {
                relationships: {
                    'related-model': {
                        data: {
                            type: 'related-models',
                            id: '6'
                        }
                    }
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should support including nested has-many relationships', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model1.relations['related-models'] = bookshelf.Collection.forge([model2]);
        model2.relations['nested-related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr: 'value' }),
            bookshelf.Model.forge({ id: '11', attr: 'value' })
        ]);
        var collection = bookshelf.Collection.forge([model1]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-models': {
                            data: [
                                {
                                    id: '10',
                                    type: 'nested-related-models'
                                },
                                {
                                    id: '11',
                                    type: 'nested-related-models'
                                }
                            ],
                            links: {
                                self: domain + "/related-models/6/relationships/nested-related-models",
                                related: domain + "/related-models/6/nested-related-models"
                            }
                        }
                    }
                },
                {
                    id: '10',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                },
                {
                    id: '11',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ],
            data: [
                {
                    relationships: {
                        'related-models': {
                            data: [
                                {
                                    id: '6',
                                    type: 'related-models'
                                }
                            ]
                        }
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should support including nested relationships when acting on a collection', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model1.relations['related-model'] = model2;
        model2.relations['nested-related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr: 'value' }),
            bookshelf.Model.forge({ id: '11', attr: 'value' })
        ]);
        var collection = bookshelf.Collection.forge([model1]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-models': {
                            data: [{
                                    type: 'nested-related-models',
                                    id: '10'
                                }, {
                                    type: 'nested-related-models',
                                    id: '11'
                                }]
                        }
                    }
                },
                {
                    id: '10',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                },
                {
                    id: '11',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ],
            data: [{
                    relationships: {
                        'related-model': {
                            data: {
                                type: 'related-models',
                                id: '6'
                            }
                        }
                    }
                }]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should put the array of related objects in the included array with proper attributes even if relation is empty', function () {
        var model1 = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model1.relations['related-models'] = bookshelf.Collection.forge();
        var model2 = bookshelf.Model.forge({ id: '6', attr: 'value' });
        model2.relations['related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '12', attr2: 'value22' }),
            bookshelf.Model.forge({ id: '13', attr2: 'value23' })
        ]);
        var collection = bookshelf.Collection.forge([model1, model2]);
        var result = mapper.map(collection, 'models');
        var expected = {
            included: [
                {
                    id: '12',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value22'
                    }
                },
                {
                    id: '13',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value23'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should give an option to ignore relations', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr2: 'value20' }),
            bookshelf.Model.forge({ id: '11', attr2: 'value21' })
        ]);
        var result1 = mapper.map(model, 'models', { relations: { included: true } });
        var result2 = mapper.map(model, 'models', { relations: false });
        var expected1 = {
            included: [
                {
                    id: '10',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value20'
                    }
                },
                {
                    id: '11',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value21'
                    }
                }
            ]
        };
        expect(_.matches(expected1)(result1)).toBe(true);
        expect(_.has(result2, 'data.relationships.related-models')).toBe(false);
        expect(_.has(result2, 'included')).toBe(false);
    });
    it('should give an option to choose which relations to add', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-one'] = bookshelf.Model.forge({ id: '10', attr1: 'value1' });
        model.relations['related-two'] = bookshelf.Model.forge({ id: '20', attr2: 'value2' });
        var result = mapper.map(model, 'models', { relations: { fields: ['related-two'], included: true } });
        var result2 = mapper.map(model, 'models', { relations: { fields: ['related-two'], included: false } });
        var expected = {
            id: '20',
            type: 'related-twos',
            attributes: {
                attr2: 'value2'
            }
        };
        expect(result.included.length).toEqual(1);
        expect(_.matches(expected)(result.included[0])).toBe(true);
        expect(_.has(result2, 'data.relationships.related-two')).toBe(true);
        expect(_.has(result2, 'included')).toBe(false);
    });
    it('should give an option to choose which relations to include', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-one'] = bookshelf.Model.forge({ id: '10', attr1: 'value1' });
        model.relations['related-two'] = bookshelf.Model.forge({ id: '20', attr2: 'value2' });
        var result = mapper.map(model, 'models', { relations: { included: true } });
        var result2 = mapper.map(model, 'models', { relations: { included: ['related-two'] } });
        var result3 = mapper.map(model, 'models', { relations: { fields: ['related-one'], included: ['related-one', 'related-two'] } });
        var expected = {
            included: [
                {
                    id: '10',
                    type: 'related-ones',
                    attributes: {
                        attr1: 'value1'
                    }
                },
                {
                    id: '20',
                    type: 'related-twos',
                    attributes: {
                        attr2: 'value2'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
        expect(_.find(result2.included, { type: 'related-ones' })).not.toBeDefined();
        expect(_.find(result2.included, { type: 'related-twos' })).toBeDefined();
        expect(_.find(result3.included, { type: 'related-twos' })).not.toBeDefined();
        expect(_.find(result3.included, { type: 'related-ones' })).toBeDefined();
    });
    it('should specify an option to format specific types using an object', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-one'] = bookshelf.Model.forge({ id: '10', attr1: 'value1' });
        model.relations['related-two'] = bookshelf.Model.forge({ id: '20', attr2: 'value2' });
        model.relations['related-three'] = bookshelf.Model.forge({ id: '30', attr3: 'value3' });
        var result = mapper.map(model, 'resource', { typeForModel: { 'related-one': 'inners', 'related-two': 'non-plural' } });
        var expected = {
            data: {
                type: 'resources'
            },
            included: [
                {
                    id: '10',
                    type: 'inners',
                    attributes: {
                        attr1: 'value1'
                    }
                },
                {
                    id: '20',
                    type: 'non-plural',
                    attributes: {
                        attr2: 'value2'
                    }
                },
                {
                    id: '30',
                    type: 'related-threes',
                    attributes: {
                        attr3: 'value3'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should specify an option to format the type using a function', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-one'] = bookshelf.Model.forge({ id: '10', attr1: 'value1' });
        model.relations['related-two'] = bookshelf.Model.forge({ id: '20', attr2: 'value2' });
        var result = mapper.map(model, 'resource', { typeForModel: function () { return 'models'; } });
        var expected = {
            data: {
                type: 'models'
            },
            included: [
                {
                    id: '10',
                    type: 'models',
                    attributes: {
                        attr1: 'value1'
                    }
                },
                {
                    id: '20',
                    type: 'models',
                    attributes: {
                        attr2: 'value2'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should give an option to modify attribute properties with a function', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-one'] = bookshelf.Model.forge({ id: '10', attr1: 'value1' });
        model.relations['related-two'] = bookshelf.Model.forge({ id: '20', attr2: 'value2' });
        var result = mapper.map(model, 'models', { keyForAttr: _.toUpper });
        var expected = {
            data: {
                attributes: {
                    ATTR: 'value'
                }
            },
            included: [
                {
                    attributes: {
                        ATTR1: 'value1'
                    }
                },
                {
                    attributes: {
                        ATTR2: 'value2'
                    }
                }
            ]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should merge for the template correctly', function () {
        var elements = _.range(3).map(function (num) {
            var model = bookshelf.Model.forge({ id: num, attr: 'value' + num });
            model.relations.rels = bookshelf.Collection.forge([]);
            return model;
        });
        elements[0].related('rels').add(bookshelf.Model.forge({ id: 3, attr: 'value' }));
        var collection = bookshelf.Collection.forge(elements);
        var result = mapper.map(collection, 'models');
        var expected = {
            data: [{
                    type: 'models',
                    id: '0',
                    relationships: {
                        rels: {
                            data: [{ type: 'rels', id: '3' }]
                        }
                    }
                }],
            included: [{
                    type: 'rels',
                    id: '3',
                    attributes: { attr: 'value' }
                }]
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should give an API to merge relations attributes', function () {
        pending('Not targeted for release 1.x');
    });
    it('should give an option to include relations', function () {
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        model.relations['related-models'] = bookshelf.Collection.forge([
            bookshelf.Model.forge({ id: '10', attr2: 'value20' }),
            bookshelf.Model.forge({ id: '11', attr2: 'value21' })
        ]);
        var result1 = mapper.map(model, 'models', { relations: { included: true } });
        var result2 = mapper.map(model, 'models', { relations: { included: false } });
        var result3 = mapper.map(model, 'models', { relations: false });
        var expected1 = {
            included: [
                {
                    id: '10',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value20'
                    }
                },
                {
                    id: '11',
                    type: 'related-models',
                    attributes: {
                        attr2: 'value21'
                    }
                }
            ]
        };
        expect(_.matches(expected1)(result1)).toBe(true);
        expect(_.has(result1, 'data.relationships.related-models')).toBe(true);
        expect(_.has(result2, 'data.relationships.related-models')).toBe(true);
        expect(_.has(result2, 'included')).toBe(false);
        expect(_.has(result3, 'data.relationships.related-models')).toBe(false);
        expect(_.has(result3, 'included')).toBe(false);
    });
});
describe('Serializer options', function () {
    var bookshelf;
    var mapper;
    var domain = 'https://domain.com';
    beforeAll(function () {
        bookshelf = bs(knex({}));
    });
    it('should not overwrite typeForAttribute function passed to serializer', function () {
        mapper = new Mapper.Bookshelf(domain, { typeForAttribute: function () { return 'type'; } });
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var result = mapper.map(model, 'model');
        var expected = {
            data: {
                type: 'type'
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should not overwrite keyForAttribute function passed to serializer', function () {
        mapper = new Mapper.Bookshelf(domain, { keyForAttribute: _.kebabCase });
        var model = bookshelf.Model.forge({ id: '5', oneAttr: 'value' });
        var result = mapper.map(model, 'model');
        var expected = {
            data: {
                attributes: {
                    'one-attr': 'value'
                }
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should overwrite pluralizeType option passed to serializer', function () {
        mapper = new Mapper.Bookshelf(domain, { pluralizeType: false });
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var result = mapper.map(model, 'model');
        var expected = {
            data: {
                type: 'models'
            }
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
    it('should includes meta object option passed to serializer', function () {
        var meta = { key: 1 };
        mapper = new Mapper.Bookshelf(domain);
        var model = bookshelf.Model.forge({ id: '5', attr: 'value' });
        var result = mapper.map(model, 'model', { meta: meta });
        var expected = {
            data: {
                type: 'models'
            },
            meta: meta
        };
        expect(_.matches(expected)(result)).toBe(true);
    });
});
describe('Plugins', function () {
    var bookshelf;
    var mapper;
    var domain = 'https://domain.com';
    beforeAll(function () {
        bookshelf = bs(knex({}));
        bookshelf.plugin('visibility');
        mapper = new Mapper.Bookshelf(domain);
    });
    afterAll(function (done) {
        bookshelf.knex.destroy(done);
    });
    describe('Visibility', function () {
        it('should respect the visible property', function () {
            var topModel = bookshelf.Model.extend({
                visible: ['first_name', 'last_name']
            });
            var relModel = bookshelf.Model.extend({
                visible: ['description']
            });
            var model = topModel.forge({
                id: 1,
                first_name: 'Joe',
                last_name: 'Doe',
                email: 'joe@example.com'
            });
            model.relations.foo = relModel.forge({
                id: 2,
                description: "Joe's foo",
                secret: "Pls don't tell anyone"
            });
            var collection = bookshelf.Collection.forge([model]);
            var result = mapper.map(collection, 'model');
            var expected = {
                data: [{
                        type: 'models',
                        id: '1',
                        attributes: {
                            first_name: 'Joe',
                            last_name: 'Doe'
                        },
                        relationships: {
                            foo: {
                                data: {
                                    type: 'foos',
                                    id: '2'
                                }
                            }
                        }
                    }],
                included: [{
                        type: 'foos',
                        id: '2',
                        attributes: {
                            description: "Joe's foo"
                        }
                    }]
            };
            expect(_.isMatch(result, expected)).toBe(true);
            expect(_.keys(result.data[0].attributes)).toEqual(['first_name', 'last_name']);
            expect(_.keys(result.included[0].attributes)).toEqual(['description']);
        });
        it('should respect the hidden property', function () {
            var topModel = bookshelf.Model.extend({
                hidden: ['email']
            });
            var relModel = bookshelf.Model.extend({
                hidden: ['secret']
            });
            var model = topModel.forge({
                id: 1,
                first_name: 'Joe',
                last_name: 'Doe',
                email: 'joe@example.com'
            });
            model.relations.foo = relModel.forge({
                id: 2,
                description: "Joe's foo",
                secret: "Pls don't tell anyone"
            });
            var collection = bookshelf.Collection.forge([model]);
            var result = mapper.map(collection, 'model');
            var expected = {
                data: [{
                        type: 'models',
                        id: '1',
                        attributes: {
                            first_name: 'Joe',
                            last_name: 'Doe'
                        },
                        relationships: {
                            foo: {
                                data: {
                                    type: 'foos',
                                    id: '2'
                                }
                            }
                        }
                    }],
                included: [{
                        type: 'foos',
                        id: '2',
                        attributes: {
                            description: "Joe's foo"
                        }
                    }]
            };
            expect(_.isMatch(result, expected)).toBe(true);
            expect(_.keys(result.data[0].attributes)).toEqual(['first_name', 'last_name']);
            expect(_.keys(result.included[0].attributes)).toEqual(['description']);
        });
    });
});
describe('Issues', function () {
    var bookshelf;
    var mapper;
    var domain = 'https://domain.com';
    beforeAll(function () {
        bookshelf = bs(knex({}));
        mapper = new Mapper.Bookshelf(domain);
    });
    afterAll(function (done) {
        bookshelf.knex.destroy(done);
    });
    it('#77', function () {
        // model with full relations
        var model1 = bookshelf.Model.forge({
            id: 14428,
            foo_id: 2973,
            bar_id: 59,
            name: 'Bla #14428',
            created_at: null,
            updated_at: null,
            deleted_at: null
        });
        model1.relations.foo = bookshelf.Model.forge({
            id: 2973,
            name: 'Foo #2973',
            created_at: null,
            updated_at: null,
            deleted_at: null
        });
        model1.relations.bar = bookshelf.Model.forge({
            id: 59,
            foo_id: 2973,
            name: 'Bar #59',
            created_at: null,
            updated_at: null,
            deleted_at: null
        });
        // model with one relation bar_id = null
        var model2 = bookshelf.Model.forge({
            id: 14417,
            foo_id: 2973,
            bar_id: null,
            name: 'Bla #14417',
            created_at: null,
            updated_at: null,
            deleted_at: null
        });
        model2.relations.foo = bookshelf.Model.forge({
            id: 2973,
            name: 'Foo #2973',
            created_at: null,
            updated_at: null,
            deleted_at: null
        });
        model2.relations.bar = bookshelf.Model.forge({});
        var collection1 = bookshelf.Collection.forge([
            model1, model2
        ]);
        var result1 = mapper.map(collection1, 'model');
        var expected1 = {
            included: [{
                    type: 'foos',
                    id: '2973'
                }, {
                    type: 'bars',
                    id: '59'
                }]
        };
        expect(_.matches(expected1)(result1)).toBe(true);
        var collection2 = bookshelf.Collection.forge([
            model2, model1
        ]);
        var result2 = mapper.map(collection2, 'model');
        var expected2 = {
            included: [{
                    type: 'foos',
                    id: '2973'
                }, {
                    type: 'bars',
                    id: '59'
                }]
        };
        expect(_.matches(expected2)(result2)).toBe(true);
    });
    it('#81', function () {
        var user = bookshelf.Model.forge({
            id: 1,
            email: 'email@gmail.com',
            first_name: 'Ad',
            last_name: 'Oner',
            org_id: 1,
            connect_type: '',
            created_at: '2016-07-04T10:48:27.000Z',
            updated_at: '2016-10-09T19:10:38.000Z'
        });
        user.relations.organization = bookshelf.Model.forge({
            'id': 1,
            phone: '',
            company_name: 'MyCompany',
            created_at: '2016-07-04T10:46:53.000Z',
            updated_at: '2016-07-04T10:46:53.000Z'
        });
        var result = mapper.map(user, 'user');
        var expected = {
            data: {
                type: 'users',
                id: '1',
                relationships: {
                    organization: {
                        data: {
                            type: 'organizations',
                            id: '1'
                        }
                    }
                }
            },
            included: [{
                    type: 'organizations',
                    id: '1'
                }]
        };
        expect(_.isMatch(result, expected)).toBe(true);
    });
});
//# sourceMappingURL=bookshelf-spec.js.map