(function ($) {
  Vue.config.devtools = true;
  if (!$('#activity-finder-app').length) {
    return;
  }

  var router = new VueRouter({
    mode: 'history',
    routes: []
  });

  new Vue({
    el: '#activity-finder-app',
    router: router,
    data: {
      step: 0,
      loading: false,
      isSearchSubmitDisabled: true,
      isStep1NextDisabled: true,
      isStep2NextDisabled: true,
      isStep3NextDisabled: true,
      keywords: '',
      step_1_query: '',
      step_2_query: '',
      step_3_query: '',
      afResultsRef: '',
      hideProgramStep: 0,
      hideLocationStep: 0,
      total_steps: 3,
      current_step: 0,
      table: {
        count: 0,
        facets: {
          field_session_min_age: [],
          field_session_max_age: [],
          field_session_time_days: [],
          field_category_program: [],
          field_activity_category: [],
          field_session_location: []
        }
      },
      checkedAges: [],
      checkedDays: [],
      checkedProgramTypes: [],
      checkedCategories: [],
      checkedLocations: [],
      checkedStep1Filters: '',
      checkedStep1PrevFilters: '',
      checkedStep2Filters: '',
      checkedStep2PrevFilters: '',
      checkedStep3Filters: '',
      checkedStep3PrevFilters: '',
      categories: {}
    },
    methods: {
      toStep: function(s) {
        this.step = s;
        this.current_step = s;
        this.updateStepsViewAll(s);
      },
      skip: function() {
        if (this.step == 3) {
          // Redirect to Search page.
          window.location.href = this.afResultsRef + window.location.search;
        }
        else {
          this.step++;
          this.current_step++;
        }
      },
      prev: function() {
        this.step--;
      },
      next: function() {
        if (this.hideLocationStep == 1 && this.hideLocationStep == 1) {
          // Redirect to Search page.
          this.updateCategoriesParam();
          this.updateSearchQuery();
          window.location.href = this.afResultsRef + window.location.search;
          return;
        }
        if (this.step == 3) {
          // Redirect to Search page.
          window.location.href = this.afResultsRef + window.location.search;
        }
        this.step++;
        this.current_step++;
        if (this.step == 2 && this.hideProgramStep == 1) {
          this.current_step = 2;
          this.step = 3;
          this.checkFilters(2);
        }
        if (this.step == 2 && this.checkedProgramTypes.length === 0) {
          this.current_step = 3;
          this.step = 3;
          this.checkFilters(2);
        }
        if (this.step == 3 && this.hideLocationStep == 1) {
          this.current_step = 2;
          this.step = 3;
          this.checkFilters(2);
        }
        this.updateStepsViewAll(this.step);
        this.runAjaxRequest();
      },
      submitSearch: function() {
        // Redirect to Search page.
        window.location.href = this.afResultsRef + window.location.search;
      },
      startOver: function() {
        var component = this;
        router.push({ query: {}});
        component.step = 0;
        component.keywords = '';
        component.checkedAges = [];
        component.checkedDays = [];
        component.checkedProgramTypes = [];
        component.checkedCategories = [];
        component.checkedLocations = [];
        component.checkedStep1Filters = '';
        component.checkedStep2Filters = '';
        component.checkedStep3Filters = '';
        this.runAjaxRequest();
      },
      updateStepsViewAll: function(step) {
        var component = this;
        switch (step) {
          case 1:
            component.step_1_query = window.location.search;
            break;
          case 2:

            component.step_2_query = window.location.search;
            break;
          case 3:
            // If no Category was selected on Step 2.
            if (this.checkedCategories.length == 0 && this.selectedCategories.length != 0) {
              this.updateCategoriesParam();
            }

            component.step_3_query = window.location.search;
            break;
        }
      },
      // Populate Categories filter from selected top level Categories.
      updateCategoriesParam: function() {
        var selectedCategories = [];
        for (i in this.selectedCategories) {
          for (j in this.selectedCategories[i].value) {
            if (typeof(this.selectedCategories[i].value[j].value) !== 'undefined') {
              selectedCategories.push(this.selectedCategories[i].value[j].value);
            }
          }
        }
        this.checkedCategories = selectedCategories;
      },
      updateSearchQuery: function() {
        var component = this;
        router.push({ query: {
          keywords: encodeURIComponent(component.keywords),
          ages: encodeURIComponent(component.checkedAges),
          program_types: encodeURIComponent(component.checkedProgramTypes),
          categories: encodeURIComponent(component.checkedCategories),
          days: encodeURIComponent(component.checkedDays),
          locations: encodeURIComponent(component.checkedLocations)
        }});
      },
      checkFilters: function(step) {
        var component = this,
            filters = [],
            prevFilters = [];
        switch (step) {
          case 0:
            component.isSearchSubmitDisabled = true;
            if (component.keywords) {
              component.isSearchSubmitDisabled = false;
            }
          break;
          // Step with selecting Age, Day of Week, Categories top level.
          case 1:
            component.checkedStep1Filters = '';
            component.isStep1NextDisabled = true;
            if (component.checkedAges.length > 0 ||
              component.checkedDays.length > 0 ||
              component.checkedProgramTypes.length > 0) {

              component.isStep1NextDisabled = false;

              // Map ids to titles.
              for (key in component.checkedAges) {
                if (typeof(component.checkedAges[key]) !== 'function' && $('#af-age-filter-' + component.checkedAges[key])) {
                  filters.push($('#af-age-filter-' + component.checkedAges[key]).parent('label').text());
                }
              }

              // Map ids to titles.
              for (key in component.checkedDays) {
                if (typeof(component.checkedDays[key]) !== 'function' && $('#af-day-filter-' + component.checkedDays[key])) {
                  filters.push($('#af-day-filter-' + component.checkedDays[key]).parent('label').text());
                }
              }
              // Depends on widget type radio or checkbox checkedProgramTypes contains string or object.
              if (typeof component.checkedProgramTypes === 'string') {
                component.checkedProgramTypes.length > 0 ? filters.push(component.checkedProgramTypes) : '';
              }
              else {
                component.checkedProgramTypes.length > 0 ? filters.push(component.checkedProgramTypes.join(', ')) : '';
              }
              component.checkedStep1Filters = filters.join(', ');
              component.checkedStep2PrevFilters = component.checkedStep1Filters;
            }
            break;
          // Select Categories.
          case 2:
            component.checkedStep2Filters = '';
            component.isStep2NextDisabled = true;
            if (component.checkedCategories.length > 0) {
              component.isStep2NextDisabled = false;
              // Map ids to titles.
              var checkedMapCategories = [];
              // Depends on widget type radio or checkbox checkedCategories contains string or object.
              if (typeof component.checkedCategories === 'string') {
                if (typeof(component.checkedCategories) !== 'function' && $('input[value="' + component.checkedCategories + '"]').length !== 0) {
                  checkedMapCategories.push($('input[value="' + component.checkedCategories + '"]').parent('label').text());
                }
              }
              else {
                for (key in component.checkedCategories) {
                  if (typeof(component.checkedCategories[key]) !== 'function' && $('input[value="' + component.checkedCategories[key] + '"]').length !== 0) {
                    checkedMapCategories.push($('input[value="' + component.checkedCategories[key] + '"]').parent('label').text());
                  }
                }
              }
              filters.push(checkedMapCategories.join(', '));
              component.checkedStep2Filters = filters.join(', ');
            }
            component.checkedStep1Filters ? prevFilters.push(component.checkedStep1Filters) : '';
            component.checkedStep2Filters ? prevFilters.push(component.checkedStep2Filters) : '';
            component.checkedStep3PrevFilters = prevFilters.join(', ');
            break;
          // Select Locations.
          case 3:
            component.checkedStep3Filters = '';
            component.isStep3NextDisabled = true;
            if (component.checkedLocations.length > 0) {
              component.isStep3NextDisabled = false;

              // Map ids to titles.
              var checkedMapLocations = [];
              for (key in component.checkedLocations) {
                if (typeof(component.checkedLocations[key]) !== 'function' && $('input[value="' + component.checkedLocations[key] + '"]').length !== 0) {
                  checkedMapLocations.push($('input[value="' + component.checkedLocations[key]+'"]').parent('label').find('span').text());
                }
              }
              filters.push(checkedMapLocations.join(', '));
              component.checkedStep3Filters = filters.join(', ');
            }
            break;
        }
      },
      runAjaxRequest: function() {
        var component = this;

        var url = drupalSettings.path.baseUrl + 'af/get-data';

        if (window.location.search !== '') {
          url += window.location.search;
        }

        component.loading = true;
        $.getJSON(url, function(data) {
          component.table = data;
          component.loading = false;
        }).done(function() {
          // We need to wait in order to affect the DOM after the tiles have been injected.
          setTimeout(function () {
            $('*[data-mh]').matchHeight();
          }), 500;
        });
      },
      locationCounter: function(locationId) {
        if (typeof this.locationCounters[locationId] == 'undefined') {
          return 0;
        }
        return this.locationCounters[locationId];
      },
      getLocationsCounter: function(key) {
        if (typeof(this.table.groupedLocations) == 'undefined' || typeof(this.table.groupedLocations[key]) == 'undefined') {
          return 0;
        }
        return this.table.groupedLocations[key].count;
      },
      locationsSelected: function(e) {
        return $(".location-group-name:contains(" + e + ")").parents('.checkbox-group-wrapper').find('.selected').length;
        // get the number of selected locations.
      },
      toggleCardState: function(e) {
        var element = $(e.target),
            deselect = element.data('deselect') ? element.data('deselect') : '';
        if (element.attr('type') === 'radio') {
          // Unselect all others radios in group.
          $('input[name="' + element.attr('name') + '"]').parents('.openy-card__item').removeClass('selected');
          element.parents('.openy-card__item').addClass('selected');
        }
        if (!element.parents('.openy-card__item').hasClass('selected')) {
          // Unselect all others.
          if (deselect) {
            element.parents('.activity-finder__step_content').find('.openy-card__item').removeClass('selected');
          }
          element.parents('.openy-card__item').addClass('selected');
        }
        else {
          if (deselect) {
            // Remove value from radio. This is hardcoded for Categories only.
            // If in the future we will need to have similar behavior for other
            // group of radios we will need to pass variable name to this method.
            this.checkedCategories = [];
          }

          element.parents('.openy-card__item').removeClass('selected');
        }
      },
    },
    computed: {
      locationCounters: function() {
        var counters = [];
        if (typeof this.table.facets.locations == 'undefined') {
          return counters;
        }
        for (key in this.table.facets.locations) {
          counters[this.table.facets.locations[key].id] = this.table.facets.locations[key].count;
        }

        return counters;
      },
      topLevelCategories: function() {
        var topLevel = [];
        for (key in this.categories) {
          if (this.categories[key].label) {
            topLevel.push(this.categories[key].label);
          }
        }
        return topLevel;
      },
      selectedCategories: function() {
        var selected = [];
        for (key in this.categories) {
          if (this.checkedProgramTypes.indexOf(this.categories[key].label) != -1) {
            selected.push(this.categories[key]);
          }
        }
        return selected;
      }
    },
    mounted: function() {
      var component = this;
      component.categories = drupalSettings.activityFinder.categories;
      component.runAjaxRequest();

      component.$watch('keywords', function(){
        component.updateSearchQuery();
        component.checkFilters(0);
      });
      component.$watch('checkedAges', function(){
        component.updateSearchQuery();
        component.checkFilters(1);
      });
      component.$watch('checkedDays', function(){
        component.updateSearchQuery();
        component.checkFilters(1);
      });
      component.$watch('checkedProgramTypes', function(){
        component.updateSearchQuery();
        component.checkFilters(1);
      });
      component.$watch('checkedCategories', function(){
        component.updateSearchQuery();
        component.checkFilters(2);
      });
      component.$watch('checkedLocations', function(){
        component.updateSearchQuery();
        component.checkFilters(3);
      });
      // Get url from paragraph's field.
      component.afResultsRef = 'OpenY' in window ? window.OpenY.field_prgf_af_results_ref[0]['url'] : '';
      // Get 1/0 from paragraph's field.
      component.hideProgramStep = $('.field-prgf-hide-program-categ').text();
      // Get 1/0 from paragraph's field.
      component.hideLocationStep = $('.field-prgf-hide-loc-select-step').text();
      if (this.hideProgramStep == 1) {
        this.total_steps--;
      }
      if (this.hideLocationStep == 1) {
        this.total_steps--;
      }
    },
    delimiters: ["${","}"]
  });
})(jQuery);
