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
    console.log('[hasAllRequiredFields] Checking searchData:', searchData);
    console.log('[hasAllRequiredFields] Against searchConfig:', searchConfig);
    const result = Object.entries(searchConfig.searchData).every(([key, config]) => {
        if (config.required) {
            const value = searchData[key];
            console.log(`[hasAllRequiredFields] Checking required field "${key}":`, {
                value,
                isValid: value !== undefined && value !== null && value !== ''
            });
            return value !== undefined && value !== null && value !== '';
        }
        return true;
    });
    console.log('[hasAllRequiredFields] Final result:', result);
    return result;
}
exports.hasAllRequiredFields = hasAllRequiredFields;
