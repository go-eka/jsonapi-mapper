'use strict';
var lodash_1 = require("lodash");
var inflection_1 = require("inflection");
var qs_1 = require("qs");
function urlConcat() {
    var parts = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parts[_i] = arguments[_i];
    }
    return parts.join('/');
}
/**
 * Creates top level links object, for primary data and pagination links.
 */
function topLinks(linkOpts) {
    var baseUrl = linkOpts.baseUrl, type = linkOpts.type, pag = linkOpts.pag;
    var obj = {
        self: urlConcat(baseUrl, inflection_1.pluralize(type))
    };
    // Build pagination if available
    if (pag) {
        // Support Bookshelf's built-in paging parameters
        if (pag.rowCount) {
            pag.total = pag.rowCount;
        }
        // Only add pagination links when more than 1 page
        if (pag.total > 0 && pag.total > pag.limit) {
            lodash_1.assign(obj, pagLinks(linkOpts));
        }
    }
    return obj;
}
exports.topLinks = topLinks;
/**
 * Create links object, for pagination links.
 * Since its used only inside other functions in this model, its not exported
 */
function pagLinks(linkOpts) {
    var baseUrl = linkOpts.baseUrl, type = linkOpts.type, pag = linkOpts.pag, _a = linkOpts.query, query = _a === void 0 ? {} : _a;
    if (pag === undefined) {
        return undefined;
    }
    var offset = pag.offset, limit = pag.limit, total = pag.total;
    // All links are based on the resource type
    var baseLink = urlConcat(baseUrl, inflection_1.pluralize(type));
    // Stringify the query string without page element
    query = lodash_1.omit(query, ['page', 'page[limit]', 'page[offset]']);
    baseLink = baseLink + '?' + qs_1.stringify(query, { encode: false });
    var obj = {};
    // Add leading pag links if not at the first page
    if (offset > 0) {
        obj.first = function () {
            var page = { page: { limit: limit, offset: 0 } };
            return baseLink + qs_1.stringify(page, { encode: false });
        };
        obj.prev = function () {
            var page = { page: { limit: limit, offset: offset - limit } };
            return baseLink + qs_1.stringify(page, { encode: false });
        };
    }
    // Add trailing pag links if not at the last page
    if (total && (offset + limit < total)) {
        obj.next = function () {
            var page = { page: { limit: limit, offset: offset + limit } };
            return baseLink + qs_1.stringify(page, { encode: false });
        };
        obj.last = function () {
            // Avoiding overlapping with the penultimate page
            var lastLimit = (total - (offset % limit)) % limit;
            // If the limit fits perfectly in the total, reset it to the original
            lastLimit = lastLimit === 0 ? limit : lastLimit;
            var lastOffset = total - lastLimit;
            var page = { page: { limit: lastLimit, offset: lastOffset } };
            return baseLink + qs_1.stringify(page, { encode: false });
        };
    }
    return !lodash_1.isEmpty(obj) ? obj : undefined;
}
/**
 * Creates links object for a resource
 */
function dataLinks(linkOpts) {
    var baseUrl = linkOpts.baseUrl, type = linkOpts.type;
    var baseLink = urlConcat(baseUrl, inflection_1.pluralize(type));
    return {
        self: function (resource) {
            return urlConcat(baseLink, resource.id);
        }
    };
}
exports.dataLinks = dataLinks;
/**
 * Creates links object for a relationship
 */
function relationshipLinks(linkOpts, related) {
    var baseUrl = linkOpts.baseUrl, type = linkOpts.type;
    var baseLink = urlConcat(baseUrl, inflection_1.pluralize(type));
    return {
        self: function (resource, current, parent) {
            return urlConcat(baseLink, parent.id, 'relationships', related);
        },
        related: function (resource, current, parent) {
            return urlConcat(baseLink, parent.id, related);
        }
    };
}
exports.relationshipLinks = relationshipLinks;
/**
 * Creates links object for a related resource, to be used for the included's array
 */
function includedLinks(linkOpts) {
    var baseUrl = linkOpts.baseUrl, type = linkOpts.type;
    var baseLink = urlConcat(baseUrl, inflection_1.pluralize(type));
    return {
        self: function (primary, current) {
            return urlConcat(baseLink, current.id);
        }
    };
}
exports.includedLinks = includedLinks;
//# sourceMappingURL=links.js.map