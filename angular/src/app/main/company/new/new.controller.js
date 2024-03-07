(function ()
{
    'use strict';

    angular
        .module('app.company-new')
        .controller('CompanyNewController', CompanyNewController);

    /** @ngInject */
    function CompanyNewController(transService, api, $location, $auth, $window, $timeout, $rootScope, paymentService)
    {
        var vm = this;
        transService.loadFile('main/company/new');

        vm.form = {
            name: '',
            vat_payer: true,
            vat_release_reason_id: null,
            vat_release_reason_note: ''
        };

        vm.form_full = {
            vatin: '',
            name: '',
            email: '',
            phone: '',
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
            contact_address_country: 'POLSKA'
        };

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.show_full = false;
        vm.vat_release_reasons = {};

        vm.create = create;
        vm.getGus = getGus;
        vm.skip = skip;

        init();

        function init() {
            api.vatReleaseReasons.get({}, function (response) {
                angular.forEach(response.data, function (value) {
                    vm.vat_release_reasons[value.id] = value;
                })
            })
        }

        function getGus() {
            vm.request_sending = true;
            vm.msg_error = '';
            var vatin = vm.form_full.vatin.toString().split('-').join('');
            api.gusCompany.get({vatin:vatin}, function (response) {
                if (response.data.length && response.data[0].name != '') {
                    vm.form.name = response.data[0].name;
                    vm.form_full.name = response.data[0].name;
                    vm.form_full.phone = response.data[0].phone;
                    vm.form_full.email = response.data[0].email;
                    vm.form_full.main_address_street = response.data[0].main_address_street;
                    vm.form_full.main_address_number = response.data[0].main_address_number;
                    vm.form_full.main_address_city = response.data[0].main_address_city;
                    vm.form_full.main_address_zip_code = response.data[0].main_address_zip_code;
                    vm.form_full.contact_address_street = response.data[0].main_address_street;
                    vm.form_full.contact_address_number = response.data[0].main_address_number;
                    vm.form_full.contact_address_city = response.data[0].main_address_city;
                    vm.form_full.contact_address_zip_code = response.data[0].main_address_zip_code;

                    create(true);
                    
                } else {
                    vm.msg_error = transService.translate('COMPANY_NEW.GUS_ERROR');
                    vm.request_sending = false;
                }
            }, function (response) {
                vm.msg_error = transService.getErrorMassage(response);
                vm.request_sending = false;
            });

        }

        function skip() {
            vm.show_full = true;
        }

        function endCreate(from_gus) {
            $auth.refreshUser(function () {

                if (from_gus) {
                    api.company.company.put(vm.form_full,
                        // success
                        function () {
                            vm.request_sending = false;

                            if(!$rootScope.is_fv && __env.new_company_to_new_project_redirection) {
                                // if no projects goes to create one
                                $location.url('/projects/list');
                            } else {
                                $location.url('/company/edit?first=true');
                            }
                        },
                        // error
                        function () {
                            $window.localStorage.company_data = JSON.stringify(vm.form_full);
                            vm.request_sending = false;

                            if(!$rootScope.is_fv && __env.new_company_to_new_project_redirection) {
                                $location.url('/projects/list');
                            } else {
                                $location.url('/company/edit?first=true');
                            }
                        }
                    );
                }
                else {
                    vm.request_sending = false;

                    if(!$rootScope.is_fv && __env.new_company_to_new_project_redirection) {
                        $location.url('/projects/list');
                    } else {
                        $location.url('/company/edit?first=true');
                    }
                }
            })
        }

        function create(from_gus) {
            vm.request_sending = true;

            api.company.company.save(vm.form,
                // success
                function(response) {
                    vm.msg_error = '';
                    //vm.msg_success = transService.translate('COMPANY_NEW.SUCCESS');
                    
                    $auth.setCurrentCompany(response.data.id, function () {

                        if (typeof $window.localStorage.package != 'undefined') {

                            var package_slug = null;
                            switch ($window.localStorage.package) {
                                case 'premium':
                                    package_slug = 'premium';
                                    break;
                                case 'classic':
                                    package_slug = 'cep_classic';
                                    break;
                                case 'business':
                                    package_slug = 'cep_business';
                                    break;
                            }

                            if (package_slug) {
                                paymentService.forceTest(package_slug, function (is_success) {
                                    delete $window.localStorage.package;
                                    if (is_success === true) {
                                        $timeout($auth.refreshCurrentPackage, 10000);
                                        endCreate(from_gus);
                                    } else {
                                        delete $window.localStorage.package;
                                        endCreate(from_gus);
                                    }
                                })
                            }
                        } else {
                            endCreate(from_gus);
                        }

                    });
                },
                // error
                function(response) {
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                    vm.request_sending = false;
                }
            );
        }
        //////////
    }
})();
