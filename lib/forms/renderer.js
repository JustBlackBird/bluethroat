/**
 * A bootstrap compatible renderer for single checkbox.
 *
 * This function should be used with the "forms" npm module.
 *
 * @param {sting} name Internal name of the field.
 * @param {Object} field An object that represents field.
 * @returns {String} Rendered fields markup.
 */
var renderCheckbox = function(name, field) {
    var widget = field.widget.toHTML(name, field);
    var label = '<label>' + widget + field.labelText(name) + '</label>';
    var error = field.error
        ? '<div class="help-block">' + field.error + '</div>'
        : '';

    var markup = '<div class="checkbox">' + label + error + '</div>';

    if (field.error) {
        markup = '<div class="has-error">' + markup + '</div>';
    }

    return markup;
};

/**
 * A bootstrap compatible renderer for input and select box.
 *
 * This function should be used with the "forms" npm module.
 *
 * @param {sting} name Internal name of the field.
 * @param {Object} field An object that represents field.
 * @returns {String} Rendered fields markup.
 */
var renderField = function(name, field) {
    field.widget.classes = field.widget.classes || [];
    field.widget.classes.push('form-control');

    var label = field.labelHTML(name);
    var error = field.error ? '<div class="help-block">' + field.error + '</div>' : '';
    var validationClass = field.error ? 'has-error' : '';
    var widget = field.widget.toHTML(name, field);

    return '<div class="form-group ' + validationClass + '">' + label + widget + error + '</div>';
};

module.exports = function (name, field) {
    switch (field.widget.type) {
        case 'checkbox':
            return renderCheckbox(name, field);
        default:
            // Try to render simple field. It's not the best idea but a suitable
            // fallback.
            return renderField(name, field);
    }
};
