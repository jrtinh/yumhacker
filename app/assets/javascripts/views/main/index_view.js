MainIndexView = Backbone.View.extend({
    events: {
        'change #redo_search': 'toggleRedoSearch'
    },

    initialize: function () {
        this.render();
        this.listenTo(Client, 'change', this.changeHeadInfo);
        this.listenTo(Filter, 'change:category_name', function (e) { 
            this.changeHeadInfo(true);
        });

        this.changeHeadInfo();

        this.collection = new EstablishmentsCollection();

        this.filter_view = new FilterView({
            el: '#main_filter_container',
        });

        this.main_index_establishments_list_view = new MainIndexEstablishmentsListView({
            el: '.establishments_list',
            collection: this.collection
        });

        this.pagination_view = new EstablishmentsIndexPaginationView({
            el: '.pagination_container',
            collection: this.collection
        });

        var params = _.extend(Location.predicate(), Filter.predicate(), Client.predicate(), this.collection.predicate());
        this.collection.fetch({ reset: true, data: params });

        if (typeof MainGoogleMap === 'undefined') {
            MainGoogleMap = new MainMapView({
                el: '#map_canvas',
                collection: this.collection
            });
        } else {
            MainGoogleMap.map.getStreetView().setVisible(false);
            $('.map_canvas_container').html('');
            MainGoogleMap.mapCanvas.appendTo($('.map_canvas_container'));
        }
        MainGoogleMap.map.getStreetView().setVisible(false);
        // This needs to be here if MainGoogleMap already exists because new collection is created above
        MainGoogleMap.collection = this.collection;
        fixMapOnScroll();
        
        this.listenTo(this.collection, 'reset', function () { MainGoogleMap.render(); });
        this.listenTo(Location, 'change', this.updateCollection);
        this.listenTo(Filter, 'change', this.updateCollection);

    },

    render: function () {
        this.$el.html(render('main/index'));
        this.$('.establishments_list').html(render('application/throbber_small'));
    },

    updateCollection: function () {
        var params = _.extend(Location.predicate(), Filter.predicate(), Client.predicate());
        this.collection.fetch({ reset: true, data: params });
        App.navigate(window.location.pathname + '?' + encodeURIComponent($.param(params)), { trigger: false, replace: false });
    },

    toggleRedoSearch: function (e) {
        Client.set('redo_search', e.target.checked);
    },

    changeHeadInfo: function (include_category) {
        var location = Client.get('formatted_address');
        var category = include_category ? Filter.get('category_name') + ' ' : '';

        if (location !== 'Current Location') {
            this.title = 'YumHacker | Find ' + category + 'restaurants recommended by people you trust | ' + Client.get('formatted_address');

            this.description = 'Find and share the best restaurants and bars in ' + Client.get('formatted_address') + ' recommended by people you trust. Create lists of your favorite restaurants to share and see the places other foodies think are the best. Get restaurant and bar photos, reviews, hours and more!';

            App.eventAggregator.trigger('domchange:title', this.title);
            App.eventAggregator.trigger('domchange:description', this.description);            
        }
    }
});
