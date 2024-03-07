(function () {
    'use strict';

    angular.module('app.calendar')
        .controller('EventFormDialogController', EventFormDialogController);

    /** @ngInject */
    function EventFormDialogController($mdDialog, dialogData)
    {
        var vm = this;

        // Data
        vm.newEvents = [];
        vm.events = dialogData.currentEvents || [];
        vm.dialogData = dialogData;
        vm.action = checkAction();
        vm.reasons = ['holidays', 'sick_note', 'day_off'];
        vm.switch = '';
        vm.templateCounter = [];
        vm.moment = moment;
        vm.errors = dialogData.errors;
        vm.custom_desc = '';
        vm.def_desc = '';

        // Methods
        vm.saveEvent = saveEvent;
        vm.closeDialog = closeDialog;
        vm.deleteEvent = deleteEvent;
        vm.incTemplate = incTemplate;
        vm.clearForm = clearForm;
        vm.setOfflineEvent = setOfflineEvent;
        vm.setOnlineEvent = setOnlineEvent;
        vm.switchAction = switchAction;
        vm.removeEvent = removeEvent;
        vm.removeNewEvent = removeNewEvent;
        vm.isSaveDisabled = isSaveDisabled;

        init();

        /**
         * Initialize
         */
        function init() {
            switch(checkAction()) {
                case 'edit-offline':
                    vm.switch = false;
                    initOfflineEventEdit();
                    break;
                case 'edit-online':
                    vm.switch = true;
                    break;
                case 'add-new':
                    vm.switch = true;
                    incTemplate();
                    break;
            }
        }


        /**
         * Save event
         */
        function saveEvent() {

            mergeToCurrentEvents(vm.newEvents)
            // clear empty events
            var events = vm.events.filter(function (e) { return e });
            events = formatEventsTime(events);

            var response = {
                day: dialogData.day,
                user: dialogData.user,
                events: events
            };

            $mdDialog.hide(response);
        }

        /**
         * Merge new events to old events
         *
         * @param array
         */
        function mergeToCurrentEvents(array) {
            if(checkAction() === 'edit-offline') {
                vm.events[0] = array[0];
                vm.events[0].description = vm.def_desc == null ? vm.custom_desc : vm.def_desc;
            } else {
                if (vm.switch) {
                    for (var i = 0; i < array.length; i++) {
                        vm.events.push(array[i]);
                    }
                } else {
                    vm.events[0] = array[0];
                    vm.events[0].description = vm.def_desc == null ? vm.custom_desc : vm.def_desc;
                }
            }
        }

        function setOfflineEvent() {
            vm.newEvents = [{
                // day: dialogData.day,
                time_start: '00:00:00',
                time_stop: '00:00:00',
                available: 0
            }]
        }

        function setOnlineEvent(n) {
            // vm.newEvents[n].day = dialogData.day;
            vm.newEvents[n].available = 1;
        }

        /**
         * Fills dialog with incoming values for Offline time  
         */
        function initOfflineEventEdit() {
            vm.newEvents.push(vm.events[0]);
            // load default value
            if (vm.reasons.indexOf(vm.events[0].description) == -1) {
                vm.def_desc = null;
                vm.custom_desc = vm.events[0].description;
            } else {
                vm.def_desc = vm.events[0].description;
            }
        }

        function switchAction() {
            clearForm();
        }

        /**
         * Close the dialog
         */
        function closeDialog() {
            $mdDialog.cancel();
        }

        /**
         * Increment template counter
         */
        function incTemplate(){
            vm.templateCounter.push(vm.templateCounter.length);
        }

        /**
         * Clear form
         */
        function clearForm() {
            vm.events = [];
            vm.newEvents = [];
            vm.templateCounter = [];

            incTemplate();
        }
        
        /**
         * Clear form
         */
        function deleteEvent() {
            var response = {
                day: dialogData.day,
                user: dialogData.user
                // no events
            };

            $mdDialog.hide(response);
        }

        /**
         * Prepare modal depend on user action
         *
         * @returns {*}
         */
        function checkAction() {
            if(vm.events.length > 0 && vm.events[0].available == false) {
                return 'edit-offline';
            } else if(vm.events.length > 0 && vm.events[0].available == true) {
                return 'edit-online';
            } else if(vm.events.length == 0) {
                return 'add-new';
            }
        }

        function formatEventsTime(events)
        {
            for (var i = 0; i < events.length; i++) {
                events[i]['time_start'] = events[i]['time_start'] ? events[i]['time_start'].trim() : '00:00:00';
                events[i]['time_stop'] = events[i]['time_stop'] ? events[i]['time_stop'].trim() : '00:00:00';

                var pattern = ['0', '0', ':', '0', '0', ':', '0', '0'];
                var startLength  = events[i]['time_start'].length;
                var stopLength  = events[i]['time_stop'].length;


                if (startLength < 7) {
                    for (var k = (startLength === 1 || startLength === 4) ? startLength + 1 : startLength; k < 8; k++) {
                        events[i]['time_start'] += pattern[k];
                    }
                }
                if (startLength === 1 || startLength === 4 || startLength === 7) {
                    events[i]['time_start'] = '0' + events[i]['time_start'];
                }

                if (stopLength < 7) {
                    for (var l = (stopLength === 1 || stopLength === 4) ? stopLength + 1 : stopLength; l < 8; l++) {
                        events[i]['time_stop'] += pattern[l];
                    }
                }
                if (stopLength === 1 || stopLength === 4 || stopLength === 7) {
                    events[i]['time_stop'] = '0' + events[i]['time_stop'];
                }
            }

            return events;
        }

        function removeEvent(index) {
            vm.events.splice(index, 1);
        }

        function removeNewEvent(index) {
            vm.newEvents.splice(index, 1);
            vm.templateCounter.pop();
        }

        function isSaveDisabled(form) {
            if (dialogData.is_admin) {
                return form.$invalid;
            } else {
                return form.$invalid || form.$pristine;
            }
        }

    }
})();
