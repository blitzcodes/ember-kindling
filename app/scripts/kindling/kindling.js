Kindling = function Kindling(App) {
    var KindlingObject = function KindlingObject(name, routeReferenceId, opts) {
        var names = {
            lc: name.toLowerCase(),
            uc: name.ucwords(),
            lcPlural: name.toLowerCase().pluralize(),
            ucPlural: name.ucwords().pluralize(),
            spark: ''
        };

        var self = {
            names: names,
            opts: opts,
            model: function () {
                return App[names.uc];
            },
            modelFields: function () {
                return Ember.get(App[names.uc], 'fields');
            },
            router: function () {
                return App.Router;
            },
            routesMapped: [
            ],
            sparks: KindlingSpark(App, names)
        };

        opts.model = _.extend(opts.model || {}, {
            id: DS.attr('number')
        });

        App[names.uc] = DS.Model.extend();
        // Allow the model's keys and values to be iterated through easily
        self.model().reopen({
            attributes: function () {
                var model = this;
                return Ember.keys(this.get('data')).map(function (key) {
                    return Em.Object.create({ model: model, key: key, valueBinding: 'model.' + key });
                });
            }.property().readOnly()
        }).FIXTURES = KindlingFixture(opts); // Add supplied fixtures, or generate some automatically for ease of testing

        // If sparks were passed along, process them.
        if (_.isObject(opts.sparks)) {
            _.each(opts.sparks, function (config, sparkName) {
                self.sparks.add(sparkName, config);
            });
        }

        // If any of the custom sparks override the defaults below, these will not be leveraged, applying the custom ones
        /*************
         * LIST
         ************/
        self.sparks.add(names.lcPlural, {
            route: {
                model: function () {
                    return this.store.find(names.lc);
                }
            },
            ctrl: {
                _type: 'arrctrl',
                sortProperties: [
                    routeReferenceId
                ],
                sortAscending: false, // false for descending
                totalItems: function () {
                    return this.store.find(names.lc).get('length');
                }.property(names.lc + '.@each.id')
            },
            map: null
        });

        /*************
         * SINGLE
         ************/
        self.sparks.add(names.lc, {
            route: {
                model: function (params) {
                    return this.store.find(names.lc, params[routeReferenceId]);
                }
            },
            ctrl: {
                _type: 'objctrl'
            },
            map: null
        });

        /*************
         * EDIT
         ************/
        self.sparks.add('edit', {
            route: {
                model: function (params) {
                    return this.store.find(names.lc, this.modelFor(names.lc).id);
                },
                setupController: function (controller, model) {
                    controller.set('model', model);
                    var buffer = model.get('attributes').map(function (attr) {
                        return { key: attr.get('key'), value: attr.get('value') };
                    });
                    controller.set('buffer', buffer);
                }
            },
            ctrl: {
                _type: 'objctrl',
                needs: names.lc,
                actions: {
                    save: function () {
                        var self = this;
                        this.get('buffer').forEach(function (attr) {
                            self.get('controllers.' + names.lc + '.model').set(attr.key, attr.value);
                        });
                        this.transitionToRoute('user', this.get('model'));
                    }
                }
            },
            map: null
        });

        /*************
         * CREATE
         ************/
        self.sparks.add('create', {
            route: {
                setupController: function (controller, model) {
                    controller.set('model', model);
                    var buffer = model.get('attributes').map(function (attr) {
                        return { key: attr.get('key'), value: attr.get('value') };
                    });
                    controller.set('buffer', buffer);
                }
            },
            ctrl: {
                _type: 'objctrl',
                needs: names.lc,
                actions: {
                    save: function () {
                        var self = this;
                        this.get('buffer').forEach(function (attr) {
                            self.get('controllers.' + names.lc + '.model').set(attr.key, attr.value);
                        });
                        this.transitionToRoute('user', this.get('model'));
                    }
                }
            }
        });

        self.router().map(function () {
            this.resource(names.lcPlural);
            this.resource(names.lc, { path: '/' + names.lc + '/:' + routeReferenceId }, function () {
                this.route('edit');
            });
        });

        Ember.Logger.log("Kindling %O", self);

        return self;
    };

    return KindlingObject;
};


function KindlingFixture(opts) {
    // If no fixtures were supplied, generate some now
    if (!_.isArray(opts.fixtures)) {
        opts.fixtures =
            [
            ];

        var dummyData = _.extend(_.clone(opts.model), { id: 0 });

        //		var fields = self.modelFields();
        //		fields.forEach(function(field, kind) {
        _.each(opts.model, function (value, field) {
            var lcField = field.toLowerCase(); // cast the field to lower case in case it isn't or camel case.

            switch (value._meta.type) {
                case 'string':
                    // Check for some common field types to supplement valid data
                    if (lcField.indexOf('email') != -1)
                        dummyData[field] = 'foo@foo.com';
                    else if (lcField.indexOf('phone') != -1)
                        dummyData[field] = '1-123-123-1234';
                    else if (lcField.indexOf('postal') != -1)
                        dummyData[field] = 'M1M 1M1';
                    else if (lcField.indexOf('zip') != -1)
                        dummyData[field] = '12345';
                    else
                        dummyData[field] = 'foo';
                    break;
                case 'number':
                    // Check for some common field types to supplement valid data
                    if (lcField.indexOf('phone') != -1)
                        dummyData[field] = '1-123-123-1234';
                    else if (lcField.indexOf('zip') != -1)
                        dummyData[field] = '12345';
                    else
                        dummyData[field] = 1;
                    break;
                case 'boolean':
                    dummyData[field] = true;
                    break;
                case 'date':
                    dummyData[field] = new Date();
                    break;
                case 'hasMany':
                case 'belongsTo':
                    break;
            }
        });

        for (var i = 1; i <= 5; i++) {
            dummyData.id = i;
            opts.fixtures.push(_.clone(dummyData));
        }
    }
    return opts.fixtures;
}

function KindlingSpark(App, names) {
    var sparks = {},
        self = {
            get: function (sparkName) {
                return sparks[sparkName];
            },
            add: function (sparkName, config) {
                if (!sparks[sparkName]) {
                    var ucSparkName = sparkName.ucwords(),
                        finalName = ucSparkName.indexOf(names.uc + names.uc) != -1 ? ucSparkName.replace(name.uc) : ucSparkName,// The advantage of .replace only running once, is it should only remove a potential duplicate from the begining of the string
                        ctrlName = finalName + 'Controller',
                        routeName = finalName + 'Route',
                        viewName = finalName + 'View';

                    Ember.Logger.log("Spark attrs: " + routeName + ", " + ctrlName + ", " + viewName);

                    if (_.isObject(config.ctrl)) {
                        switch (config.ctrl._type || 'ctrl') {
                            case 'arrctrl':
                            case 'arrCtrl':
                            case 'arrcontroller':
                            case 'arrController':
                            case 'arrayctrl':
                            case 'arrayCtrl':
                            case 'arraycontroller':
                            case 'arrayController':
                            case 'ArrayController':
                                App[ctrlName] = Ember.ArrayController.extend(config.ctrl);
                                break;
                            case 'objctrl':
                            case 'objCtrl':
                            case 'objcontroller':
                            case 'objController':
                            case 'objectctrl':
                            case 'objectCtrl':
                            case 'objectcontroller':
                            case 'objectController':
                            case 'ObjectController':
                                App[ctrlName] = Ember.ObjectController.extend(config.ctrl);
                                break;
                            default:
                                App[ctrlName] = Ember.Controller.extend(config.ctrl);
                        }
                    }
                    if (_.isObject(config.route))
                        App[routeName] = Ember.Route.extend(config.route);

                    {
                        config.view = _.defaults(config.view || {}, {
                            tagName: 'div',
                            classNames: [
                                viewName
                            ]
                        });
                        switch (config.view._type || 'view') {
                            case 'colview':
                            case 'colView':
                            case 'colllectionview':
                            case 'colllectionView':
                            case 'ColllectionView':
                                App[viewName] = Ember.CollectionView.extend(config.view);
                                break;
                            case 'conview':
                            case 'conView':
                            case 'containerview':
                            case 'containerView':
                            case 'ContainerView':
                                App[viewName] = Ember.ContainerView.extend(config.view);
                                break;
                            default:
                                App[viewName] = Ember.View.extend(config.view);
                        }
                    }

                    // Verify the map we're trying to add has not been previously routed
                    //    if (self.routesMapped.indexOf(lcFinalName) == -1) {
                    // The route map may be blank, attempt at setting up the default route for this spark.
                    // - If null, bypass and do not assign the default map, leaving it to be handled externally if needed
                    if (!_.isNull(config.map) && !_.isFunction(config.map)) {
                        //        self.routesMapped.push(lcFinalName);
                        Ember.Logger.log("Route mapping for spark: " + finalName + ", /" + names.lc + '/' + sparkName);
                        config.map = function () {
                            this.resource(names.lc, function () {
                                this.route(sparkName);
                            });
                        };
                    }

                    // Attempt to assign a default route map to this spark, if it's a function
                    if (_.isFunction(config.map))
                        App.Router.map(config.map);
                    //    }
                    //    else {
                    //        Ember.logger.error("Duplicate route assignment attempted for: " + names.lc + '/' + lcFinalName);
                    //    }

                    sparks[sparkName] = {
                        route: function () {
                            return App[routeName];
                        },
                        ctrl: function () {
                            return App[ctrlName];
                        },
                        view: function () {
                            return App[viewName];
                        }
                    };
                }
                else
                    Ember.Logger.warn("Attempting to add a duplicate spark, bypassed: " + sparkName);
            }
        };

    return self;
}
/*
 function addKeyValue(obj, key, value) {
 if (obj.hasOwnProperty(key)) {
 obj[key].push(value);
 }
 else {
 obj[key] =
 [
 value
 ];
 }
 }
 */
