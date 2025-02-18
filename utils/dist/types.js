"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasAllRequiredFields = exports.simplifySearchSchema = void 0;
// Helper function to simplify a search schema (used for constructing prompts)
function simplifySearchSchema(config) {
    return Object.entries(config.searchData).reduce((acc, [key, value]) => {
        acc[key] = {
            type: value.type,
            description: value.description
        };
        return acc;
    }, {});
}
exports.simplifySearchSchema = simplifySearchSchema;
function hasAllRequiredFields(searchData, searchConfig) {
    return Object.entries(searchConfig.searchData).every(([key, config]) => {
        if (config.required) {
            const value = searchData[key];
            return value !== undefined && value !== null && value !== '';
        }
        return true;
    });
}
exports.hasAllRequiredFields = hasAllRequiredFields;
