var App = window.App = Ember.Application.create({
//    LOG_TRANSITIONS_INTERNAL: true
});

/* Order and include as you please. */
require('scripts/store');
require('scripts/kindling/*');

App.Kindling = Kindling(App);

require('scripts/objects/*');

App.ApplicationRoute = Ember.Route.extend({
    model: function () {
        return ['red', 'yellow', 'blue'];
    }
});
