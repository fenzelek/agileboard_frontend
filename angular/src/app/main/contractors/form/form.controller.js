(function ()
{
    'use strict';

    angular
        .module('app.contractors-form')
        .controller('ContractorsFormController', ContractorsFormController);

    /** @ngInject */
    function ContractorsFormController(transService, api, $stateParams, formService, apiErrorsService, $location, $auth, $timeout, $state, $mdDialog, $scope, $window)
    {
        var vm = this;
        transService.loadFile('main/contractors/form');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.edit = false;
        vm.methods = [];
        vm.days = '';
        vm.term = '';
        vm.addresses_delivery_enabled = false;
        vm.other_contact_address = false;
        vm.other_delivery_address = false;
        vm.show_full = false;
        vm.from_gus = false;
        vm.countries = [];
        vm.pl_id = 0;
        vm.copy_nip = false;

        vm.form = {
            id: null,
            name: '',
            vatin: '',
            country_vatin_prefix_id: null,
            email: '',
            phone: '',
            company: true,
            bank_account_number: '',
            bank_name: '',
            main_address_zip_code: '',
            main_address_city: '',
            main_address_street: '',
            main_address_number: '',
            main_address_country: 'POLSKA',
            contact_address_zip_code: '',
            contact_address_city: '',
            contact_address_street: '',
            contact_address_number: '',
            contact_address_country: 'POLSKA',
            default_payment_term_days: null,
            default_payment_method_id: null,
            addresses: [{
                id: null,
                type: 'delivery',
                street: '',
                number: '',
                zip_code: '',
                city: '',
                default: true,
                country: 'POLSKA'
            }]
        };

        vm.copyToContact = copyToContact;
        vm.addDeliveryAddress = addDeliveryAddress;
        vm.delDeliveryAddress = delDeliveryAddress;
        vm.copyMainToDeliver = copyMainToDeliver;
        vm.copyContactToDeliver = copyContactToDeliver;
        vm.changeDefaultDeliver = changeDefaultDeliver;
        vm.checkErrors = checkErrors;
        vm.getGus = getGus;
        vm.skip = skip;
        vm.send = send;

        init();

        function init() {

            if (typeof $stateParams.success != 'undefined') {
                vm.msg_success = transService.translate('CONTRACTORS_FORM.ADD_SUCCESS');
            }
            if (typeof $window.localStorage.nip_new_contractor != 'undefined') {
                vm.form.vatin = $window.localStorage.nip_new_contractor;
                delete $window.localStorage.nip_new_contractor;
                vm.copy_nip = true;
            }

            $auth.getSettings(function (settings) {
                vm.addresses_delivery_enabled = settings['invoices.addresses.delivery.enabled'] == "1";
            });

            //countries
            api.company.countries.get({}, function (response) {
                vm.countries = response.data;
                var pl_key = -1;
                angular.forEach(vm.countries, function (value, key) {
                    if (value.key == 'PL') {
                        vm.pl_id = value.id;
                        pl_key = key;

                        if ($stateParams.type != 'edit') {
                            vm.form.country_vatin_prefix_id = vm.pl_id;
                        }
                    }
                });
                if (pl_key > -1) {
                    var pl = vm.countries[pl_key];
                    vm.countries.splice(pl_key, 1);
                    vm.countries.unshift(pl);
                }
            });

            api.paymentsMethod.list.get({}, function (response) {
                vm.methods = response.data;
            });

            if ($stateParams.type == 'edit' && !isNaN(Number($stateParams.id)) ) {
                vm.edit = true;
                vm.show_full = true;
                vm.other_contact_address = true;
                vm.other_delivery_address = true;

                api.contractor.get({id:$stateParams.id}, function (response) {
                    formService.generateForm(vm.form, response.data, true);

                    //set default delivery address
                    var is_default = false;
                    angular.forEach(vm.form.addresses, function (value) {
                        value.default = value.default == 1;
                        if (value.default) {
                            is_default = true;
                        }
                    });

                    if (!is_default && vm.form.addresses.length) {
                        vm.form.addresses[0].default = true;
                    }

                    vm.form.company = vm.form.vatin != '';

                    vm.form.default_payment_term_days = vm.form.default_payment_term_days == 0 ? null : vm.form.default_payment_term_days;
                    if (vm.form.default_payment_term_days && [7, 14, 30, 90].indexOf(vm.form.default_payment_term_days) == -1) {
                        vm.days = vm.form.default_payment_term_days;
                        vm.term = 'd';
                    } else {
                        vm.term = vm.form.default_payment_term_days;
                    }

                    if (!vm.form.default_payment_method_id) {
                        vm.form.default_payment_method_id = null;
                    }
                })
            } else {
                $scope.$watch(function () {return vm.form.company;},function(value){
                    if (!vm.from_gus) {
                        if (value) {
                            vm.show_full = false;
                        } else {
                            vm.show_full = true;
                        }
                    }
                });
            }
        }

        function copyToContact() {
            vm.form.contact_address_street = vm.form.main_address_street;
            vm.form.contact_address_number = vm.form.main_address_number;
            vm.form.contact_address_city = vm.form.main_address_city;
            vm.form.contact_address_zip_code = vm.form.main_address_zip_code;
            vm.form.contact_address_country = vm.form.main_address_country;
        }

        function copyMainToDeliver() {
            vm.form.addresses[0].street = vm.form.main_address_street;
            vm.form.addresses[0].number = vm.form.main_address_number;
            vm.form.addresses[0].city = vm.form.main_address_city;
            vm.form.addresses[0].zip_code = vm.form.main_address_zip_code;
            vm.form.addresses[0].country = vm.form.main_address_country;
        }

        function copyContactToDeliver() {
            vm.form.addresses[0].street = vm.form.contact_address_street;
            vm.form.addresses[0].number = vm.form.contact_address_number;
            vm.form.addresses[0].city = vm.form.contact_address_city;
            vm.form.addresses[0].zip_code = vm.form.contact_address_zip_code;
            vm.form.addresses[0].country = vm.form.contact_address_country;
        }

        /**
         * add new delivery address
         */
        function addDeliveryAddress() {
            if (vm.form.addresses.length < 9) {
                vm.form.addresses.push({
                    type: 'delivery',
                    street: '',
                    number: '',
                    zip_code: '',
                    city: '',
                    default: false,
                    country: 'POLSKA'
                });
            }
        }

        /**
         * delete last inputs delivery address
         */
        function delDeliveryAddress() {
            if (vm.form.addresses.length > 1) {
                vm.form.addresses.pop();
            }
        }

        function changeDefaultDeliver(current_index) {
            if (vm.form.addresses[current_index].default != false) {
                angular.forEach(vm.form.addresses, function (sddress, index) {
                    if (index != current_index && vm.form.addresses[index].default != false) {
                        vm.form.addresses[index].default = false;
                    }
                })
            } else {
                vm.form.addresses[0].default = true;
            }
        }

        function checkErrors(name) {

            $timeout(function () {
                angular.forEach($scope.formContractor.$error, function (field) {
                    angular.forEach(field, function (errorField) {
                        if (name == errorField.$name) {
                            errorField.$setUntouched();
                            (function (errorField) {
                                $timeout(function () {
                                    errorField.$setTouched();
                                }, 100);
                            })(errorField);
                        }
                    })
                });
            });
        }
        
        function getGus() {

            vm.request_sending = true;
            vm.msg_error = '';
            vm.msg_success = '';

            var vatin = vm.form.vatin.toString().split('-').join('');

            api.gusCompany.get({vatin:vatin}, function (response) {
                if (response.data.length) {
                    vm.form.name = response.data[0].name;
                    vm.form.phone = response.data[0].phone;
                    vm.form.email = response.data[0].email;
                    vm.form.main_address_street = response.data[0].main_address_street;
                    vm.form.main_address_number = response.data[0].main_address_number;
                    vm.form.main_address_city = response.data[0].main_address_city;
                    vm.form.main_address_zip_code = response.data[0].main_address_zip_code;

                    if (response.data.length > 1) {
                        vm.other_delivery_address = true;
                        vm.form.addresses = [];
                        angular.forEach(response.data, function (address) {
                            vm.form.addresses.push({
                                type: 'delivery',
                                street: address.main_address_street,
                                number: address.main_address_number,
                                zip_code: address.main_address_zip_code,
                                city: address.main_address_city,
                                default: false,
                                country: 'POLSKA'
                            });
                        });
                        vm.form.addresses[0].default = true;
                    }
                    vm.show_full = true;
                    vm.from_gus = true;
                } else {
                    vm.msg_error = transService.translate('CONTRACTORS_FORM.GUS_ERROR');
                }
                vm.request_sending = false;
            }, function (response) {
                vm.msg_error = transService.getErrorMassage(response);
                vm.request_sending = false;
            });
        }

        function skip() {
            vm.show_full = true;
            vm.copy_nip = false;
        }

        function send(is_modal, create_invoice) {

            if (!vm.show_full) {
                getGus();
                return;
            }

            if (!is_modal) {
                $location.hash('');
            }

            vm.request_sending = true;
            apiErrorsService.clear('#formContractor', vm);

            //set term
            if (vm.term == 'd') {
                vm.form.default_payment_term_days = vm.days;
            } else {
                vm.form.default_payment_term_days = vm.term;
            }

            if (!vm.edit) {
                if (!vm.other_contact_address) {
                    copyToContact()
                }

                if (!vm.other_delivery_address) {
                    vm.form.addresses = [vm.form.addresses[0]];
                    copyMainToDeliver();
                }
            }

            var form = angular.copy(vm.form);
            if (form.default_payment_term_days === null) {
                delete form.default_payment_term_days;
            }
            if (form.default_payment_method_id === null) {
                delete form.default_payment_method_id;
            }

            if (vm.edit) {

                api.contractor.put(form,
                    // success
                    function(response) {
                        vm.msg_error = '';
                        vm.msg_success = transService.translate('CONTRACTORS_FORM.UPDATE_SUCCESS');
                        vm.request_sending = false;
                        if (is_modal) {
                            $mdDialog.hide();
                        } else {
                            if (create_invoice) {
                                $location.path('/invoices/form/new/' + response.data.id);
                            } else {
                                formService.formUp();
                                init();
                            }
                        }
                    },
                    // error
                    function(response) {
                        apiErrorsService.show('#formContractor', response, vm, {default_payment_term_days: 'term'});
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                        if (!is_modal) {
                            formService.formUp();
                        }
                    }
                );
            } else {

                api.contractor.save(form,
                    // success
                    function(response) {
                        if (is_modal) {
                            api.contractor.get({id:response.data.id}, function (response_full) {
                                $mdDialog.hide(response_full.data);
                            });
                        } else {
                            //reload
                            if (create_invoice) {
                                $location.path('/invoices/form/new/' + response.data.id);
                            } else {
                                $location.url('/contractors/form/new?success=true');
                                $timeout(function () {
                                    $state.reload();
                                }, 500);
                            }
                        }
                    },
                    // error
                    function(response) {
                        apiErrorsService.show('#formContractor', response, vm, {default_payment_term_days: 'term'});
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                        if (!is_modal) {
                            formService.formUp();
                        }
                    }
                );
            }
        }
        //////////
    }
})();
