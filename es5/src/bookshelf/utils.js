/**
 * The main purpose of this module is to provide utility functions
 * that follows the restrictions of the Bookshelf/Mapper/Serializer APIs
 * with the goal of simplifying the logic of the main 'map' method.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var links_1 = require("./links");
var extras_1 = require("./extras");
/**
 * Start the data processing with top level information,
 * then handle resources recursively in processSample
 */
function processData(info, data) {
    var enableLinks = info.bookOpts.enableLinks, linkOpts = info.linkOpts;
    var template = processSample(info, sample(data));
    if (enableLinks) {
        template.dataLinks = links_1.dataLinks(linkOpts);
        template.topLevelLinks = links_1.topLinks(linkOpts);
    }
    return template;
}
exports.processData = processData;
/**
 * Recursively adds data-related properties to the
 * template to be sent to the serializer
 */
function processSample(info, sample) {
    var bookOpts = info.bookOpts, linkOpts = info.linkOpts;
    var enableLinks = bookOpts.enableLinks;
    var template = {
        // Add list of valid attributes
        attributes: getAttrsList(sample, bookOpts)
    };
    // Nested relations (recursive) template generation
    lodash_1.forOwn(sample.relations, function (relSample, relName) {
        if (!relationAllowed(bookOpts, relName)) {
            return;
        }
        var relLinkOpts = lodash_1.assign(lodash_1.clone(linkOpts), { type: relName });
        var relTemplate = processSample({ bookOpts: bookOpts, linkOpts: relLinkOpts }, relSample);
        relTemplate.ref = 'id'; // Add reference in nested resources
        // Related links
        if (enableLinks) {
            relTemplate.relationshipLinks = links_1.relationshipLinks(linkOpts, relName);
            relTemplate.includedLinks = links_1.includedLinks(relLinkOpts);
        }
        // Include links as compound document
        if (!includeAllowed(bookOpts, relName)) {
            relTemplate.included = false;
        }
        template[relName] = relTemplate;
        template.attributes.push(relName);
    });
    return template;
}
/**
 * Convert any data into a model representing
 * a complete sample to be used in the template generation
 */
const sampleCache = {}; // key: tableName, value: sampled
function sample(data) {
    if (extras_1.isModel(data)) {
        const tableName = data.tableName;
        if (sampleCache[tableName]) return sampleCache[tableName];
        // override type because we will ovewrite relations
        var sampled = lodash_1.omit(lodash_1.clone(data), ['relations', 'attributes']);
        sampled.attributes = lodash_1.cloneDeep(data.attributes);
        sampled.relations = lodash_1.mapValues(data.relations, sample);
        sampleCache[tableName] = sampled;
        return sampled;
    }
    else if (extras_1.isCollection(data)) {
        var first = data.head();
        var rest = data.tail();
        return lodash_1.reduce(rest, mergeSample, lodash_1.cloneDeep(sample(first)));
    }
    else {
        return {};
    }
}
/**
 * Merge two models into a representation of both
 */
function mergeSample(main, toMerge) {
    var sampled = sample(toMerge);
    main.attributes = lodash_1.merge(main.attributes, sampled.attributes);
    main.relations = lodash_1.merge(main.relations, sampled.relations);
    return main;
}
/**
 * Retrieve model's attribute names
 * following filtering rules
 */
function getAttrsList(data, bookOpts) {
    var virtualAttrs = data.virtuals ? lodash_1.keys(data.virtuals) : [];
    var attrs = lodash_1.keys(data.attributes).concat(virtualAttrs);
    var _a = bookOpts.omitAttrs, omitAttrs = _a === void 0 ? [data.idAttribute] : _a;
    // Only return attributes that don't match any pattern passed by the user
    return lodash_1.differenceWith(attrs, omitAttrs, function (attr, omit) {
        var reg;
        if (typeof omit === 'string') {
            reg = RegExp("^" + lodash_1.escapeRegExp(omit) + "$");
        }
        else {
            reg = omit;
        }
        return reg.test(attr);
    });
}
/**
 * Based on Bookshelf options, determine if a relation must be included
 */
function relationAllowed(bookOpts, relName) {
    var relations = bookOpts.relations;
    if (typeof relations === 'boolean') {
        return relations;
    }
    else {
        var fields = relations.fields;
        return !fields || lodash_1.includes(fields, relName);
    }
}
/**
 * Based on Bookshelf options, determine if a relation must be included
 */
function includeAllowed(bookOpts, relName) {
    var relations = bookOpts.relations;
    if (typeof relations === 'boolean') {
        return relations;
    }
    else {
        var fields = relations.fields, included = relations.included;
        if (typeof included === 'boolean') {
            return included;
        }
        else {
            // If included is an array, only allow relations that are in that array
            var allowed = included;
            if (fields) {
                // If fields specified, ensure that the included relations
                // are listed as one of the relations to be serialized
                allowed = lodash_1.intersection(fields, included);
            }
            return lodash_1.includes(allowed, relName);
        }
    }
}
/**
 * Convert a bookshelf model or collection to
 * json adding the id attribute if missing
 */
function toJSON(data, bookOpts) {
    var json = null;
    if (extras_1.isModel(data)) {
        json = data.toJSON({
            shallow: true,
            virtuals: bookOpts.virtuals,
            extras: bookOpts.extras,
        }); // serialize without the relations
        // Assign the id for the model if it's not present already
        if (!lodash_1.has(json, 'id')) {
            json.id = data.id;
        }
        // Loop over model relations to call toJSON recursively on them
        lodash_1.forOwn(data.relations, function (relData, relName) {
            json[relName] = toJSON(relData, bookOpts);
        });
    }
    else if (extras_1.isCollection(data)) {
        // Run a recursive toJSON on each model of the collection
        json = data.map(function (data) {
            return toJSON(data, bookOpts);
        });
    }
    return json;
}
exports.toJSON = toJSON;
//# sourceMappingURL=utils.js.map