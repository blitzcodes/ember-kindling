var todoSpark = {
        ctrl: {
            _type: 'objctrl',
            isEditing: false,
            bufferedTitle: Ember.computed.oneWay('title'),
            actions: {
                editTodo: function () {
                    this.set('isEditing', true);
                },
                doneEditing: function () {
                    var bufferedTitle = this.get('bufferedTitle').trim();

                    if (Ember.isEmpty(bufferedTitle))
                        Ember.run.debounce(this, 'removeTodo', 0);
                    else {
                        var todo = this.get('model');
                        todo.set('title', bufferedTitle);
                        todo.save();
                    }

                    this.set('bufferedTitle', bufferedTitle);
                    this.set('isEditing', false);
                },
                cancelEditing: function () {
                    this.set('bufferedTitle', this.get('title'));
                    this.set('isEditing', false);
                },
                removeTodo: function () {
                    this.removeTodo();
                }
            },
            removeTodo: function () {
                var todo = this.get('model');

                todo.deleteRecord();
                todo.save();
            },
            saveWhenCompleted: function () {
                this.get('model').save();
            }.observes('isCompleted')
        }
    }, todoListSpark = {
        route: {
            model: function () {
                return this.store.find('todo');
            }
        },
        ctrl: {
            _type: 'arrctrl',
            actions: {
                createTodo: function () {
                    var title, todo;

                    if (!title)
                        return;

                    todo = this.store.createRecord('todo', {
                        title: title,
                        isCompleted: false
                    });
                    todo.save();

                    this.set('newTitle', '');
                },

                clearCompleted: function () {
                    var completed = this.get('completed');
                    completed.invoke('deleteRecord');
                    completed.invoke('save');
                }
            },
            remaining: Ember.computed.filterBy('content', 'isCompleted', false),
            completed: Ember.computed.filterBy('content', 'isCompleted', true),
            allAreDone: function (key, value) {
                if (value !== undefined) {
                    this.setEach('isCompleted', value);
                    return value;
                } else {
                    var length = this.get('length');
                    var completedLength = this.get('completed.length');

                    return length > 0 && length === completedLength;
                }
            }.property('length', 'completed.length')
        },
        view: {
            focusInput: function () {
                this.$('#new-todo').focus();
            }.on('didInsertElement')
        },
        map: function () {
            this.resource('todos', { path: '/' }, function () {
                this.route('active');
                this.route('completed');
            });
        }
    },
    filterTods = function (completed) {
        return {
            setupController: function () {
                var todos = this.store.filter('todo', function (todo) {
                    return completed ? todo.get('isCompleted') : !todo.get('isCompleted');
                });

                this.controllerFor('todos').set('filteredTodos', todos);
            }
        };
    };

App.Kindling('todo', 'id', {
    model: {
        title: DS.attr('string'),
        isCompleted: DS.attr('boolean')
    },
    sparks: {
        todo: todoSpark,
        edit: {
            view: {
                focusOnInsert: function () {
                    // Re-set input value to get rid of a reduntant text selection
                    this.$().val(this.$().val());
                    this.$().focus();
                }.on('didInsertElement')
            }
        },
        todosIndex: {
            route: {
                setupController: function () {
                    this.controllerFor('todos').set('filteredTodos', this.modelFor('todos'));
                }
            }
        },
        todosActive: {
            route: filterTods()
        },
        todosCompleted: {
            route: filterTods(true)
        },
        todos: todoListSpark
    }
});