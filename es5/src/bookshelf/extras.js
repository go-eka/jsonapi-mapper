/**
 * The purpose of this module is to extend the initially defined properties,
 * behaviors and characteristics of the bookshelf API
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Bookshelf Model Type Guard
 * https://basarat.gitbooks.io/typescript/content/docs/types/typeGuard.html
 */
function isModel(data) {
    return data ? !isCollection(data) : false;
}
exports.isModel = isModel;
/**
 * Bookshelf Collection Type Guard
 * https://basarat.gitbooks.io/typescript/content/docs/types/typeGuard.html
 */
function isCollection(data) {
    // Type recognition based on duck-typing
    return data ? data.models !== undefined : false;
}
exports.isCollection = isCollection;
//# sourceMappingURL=extras.js.map