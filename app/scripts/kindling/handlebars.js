Ember.Handlebars.registerHelper("toHtml", function (html) {
	return new Handlebars.SafeString(html);
});
Ember.Handlebars.helper('pluralize', function (singular, count) {
    /* From Ember-Data */
    var inflector = new Ember.Inflector(Ember.Inflector.defaultRules);

    return count === 1 ? singular : inflector.pluralize(singular);
});