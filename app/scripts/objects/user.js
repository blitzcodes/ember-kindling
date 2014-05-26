App.Kindling('user', 'id', {
    model: {
        name: DS.attr('string'),
        email: DS.attr('string'),
        phone: DS.attr('string'),
        postal: DS.attr('string'),
        zipcode: DS.attr('number')
    },
//    fixtures: [
//        {
//            id: 1,
//            name: 'foo',
//            zipcode: 'foo'
//        },
//        {
//            id: 2,
//            name: 'bar',
//            zipcode: 'bar'
//        }
//    ],
    sparks: {
        list: {
            route: {
            },
            ctrl: {
                _type: 'arrctrl'
            },
            view: {
            }
        }
    }
});
