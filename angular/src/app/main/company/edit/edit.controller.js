(function ()
{
    'use strict';

    angular
        .module('app.company-edit')
        .controller('CompanyEditController', CompanyEditController);

    /** @ngInject */
    function CompanyEditController(transService, api, $stateParams, formService, apiErrorsService, dialogService, tableService, paymentService,
                                   $auth, $location, $rootScope, $window, $scope, $timeout, menu,
                                   CurrentCompany, Countries, InvoiceFormats, PaymentsMethod, VatReleaseReasons, TaxOffices, Roles)
    {
        var vm = this;
        transService.loadFile('main/company/edit');
        transService.loadFile('translations/countries');

        vm.msg_error = ''; //for apiErrorsService
        vm.user = {};
        vm.user_role = null;
        vm.tab_selected = 0; // General active
        vm.is_profile_completed = false;
        vm.company = CurrentCompany.data;

        vm.tab1 = {
            msg_error: '',
            msg_success: '',
            other_contact_address: false,
            edit: false,
            first: false,
            countries: [],
            countriesVisible: 10,
            pl_id: 0,
            scope_form: {},
            logotype: null,
            logotype_loaded: false,
            vat_settings_is_editable: false,
            vat_release_reasons: {},
            progress: 0,

            form: {
                vatin: '',
                vat_payer: true,
                vat_release_reason_id: null,
                vat_release_reason_note: '',
                country_vatin_prefix_id: null,
                name: '',
                email: '',
                phone: '',
                logotype: null,
                remove_logotype: false,
                website: '',
                main_address_zip_code: '',
                main_address_city: '',
                main_address_street: '',
                main_address_number: '',
                main_address_country: '',
                contact_address_zip_code: '',
                contact_address_city: '',
                contact_address_street: '',
                contact_address_number: '',
                contact_address_country: '',
                force_calendar_to_complete: null,
                bank_accounts:  [
                    {
                        id: null,
                        bank_name: '',
                        number: '',
                        default: true
                    }
                ]
            }
        };

        vm.tab2 = {
            msg_error: '',
            msg_success: '',
            methods: PaymentsMethod.data,
            default: 0
        };

        vm.tab3 = {
            msg_error: '',
            msg_success: '',
            num_example: '',
            term_days: 7,
            term_custom: '',
            invoice_formats: [],
            invoice_formats_2: InvoiceFormats.data,
            invoice_registries: [],
            year_registry_id: 0,
            vat_settings_is_editable: true,
            form: {
                default_payment_term_days: '',
                default_invoice_gross_counted: 0,
                invoice_registries: [{
                    invoice_format_id: '',
                    name: 'Default',
                    prefix: '',
                    start_number: 1,
                    default: 1,
                    is_used: 0,
                }]
            }
        };

        vm.tab4 = {
            msg_error: '',
            msg_success: '',
            users: [],
            roles: [],
            editable_roles: [],
            selected_role: null,
            selected_status: 1, // Approved (Accepted)
            user_projects: {
                loading: false,
                list: []
            },
            getRoleName: getRoleName,
            setNewRole: setNewRole,
            filterUserThroughRole: filterUserThroughRole,
            getUserProjects: getUserProjects,
            pagination: null
        };

        vm.tab5 = {
            msg_error: '',
            msg_success: ''
        };

        vm.tab7 = {
            msg_error: '',
            msg_success: '',
            integrations: [],
            pagination:null,
            active_option: 1
        };

        vm.tab7_projects = {
            msg_error: '',
            msg_success: '',
            types: [],
            integrations: [],
            pagination:null,
        };

        vm.tab7_users = {
            msg_error: '',
            msg_success: '',
            users: [],
            pagination:null,
        };

        vm.tab9 = {
            msg_error: '',
            msg_success: '',
            company: {},
            request_sending: false
        };

        vm.tab10 = {
            msg_error: '',
            msg_success: '',
            edit: false,
            tax_offices: TaxOffices.data,
            scope_form: {},

            form: {
                regon: '',
                state: '',
                county: '',
                community: '',
                street: '',
                building_number: '',
                flat_number: '',
                city: '',
                zip_code: '',
                postal: '',
                tax_office_id: null
            }
        };

        vm.request_sending = false;

        init();


        vm.checkErrors = checkErrors;
        vm.addLogo = addLogo;
        vm.sendTab1 = sendTab1;
        vm.sendTab3 = sendTab3;
        vm.sendTab10 = sendTab10;
        vm.changeNumbering = changeNumbering;
        vm.copyToContact = copyToContact;
        vm.getIntegrationsProjects = getIntegrationsProjects;
        vm.refreshProjectsList = refreshProjectsList;
        vm.addIntegrationProject = addIntegrationProject;
        vm.getIntegrations = getIntegrations;
        vm.addIntegration = addIntegration;
        vm.getIntegrationsUsers = getIntegrationsUsers;
        vm.setDefaultMethod = setDefaultMethod;
        vm.addRegister = addRegister;
        vm.delRegister = delRegister;
        vm.changeDefaultRegister = changeDefaultRegister;
        vm.getUsers = getUsers;
        vm.newUser = newUser;
        vm.deleteUser = deleteUser;
        vm.editUser = editUser;
        vm.userRoleIsEditable = userRoleIsEditable;
        vm.changeSettings = changeSettings;
        vm.getPayments = paymentService.getPayments;
        vm.addBankAccount = addBankAccount;
        vm.deleteBankAccount = deleteBankAccount;
        vm.changeDefaultBankAccount = changeDefaultBankAccount;

        function init() {
            // countries - timeout because of DOM-block-rendering
            setTimeout(function () {
                var countries = Countries.data;
                var pl_key = -1;
                angular.forEach(countries, function (value, key) {
                    if (value.key == 'PL') {
                        vm.tab1.pl_id = value.id;
                        pl_key = key;
                    }
                })
                if (pl_key > -1) {
                    var pl = countries[pl_key];
                    countries.splice(pl_key, 1);
                    countries.unshift(pl);
                }
                vm.tab1.countries = countries;
            }, 200);

            //invoice format
            angular.forEach(vm.tab3.invoice_formats_2, function (value) {
                vm.tab3.invoice_formats[value.id] = value;

                if (value.format == '{%nr}/{%Y}') {
                    vm.tab3.year_registry_id = value.id;
                }
            });

            getInvoiceSettings();

            //current company
            formService.generateForm(vm.tab1.form, CurrentCompany.data, true);
            if (vm.tab1.form.main_address_country == '') {
                vm.tab1.form.main_address_country = 'POLSKA';
                vm.tab1.form.contact_address_country = 'POLSKA';
            }
            vm.tab1.vat_settings_is_editable = CurrentCompany.data.vat_settings_is_editable;
            vm.tab3.vat_settings_is_editable = CurrentCompany.data.vat_settings_is_editable;
            if (!vm.is_profile_completed) {
                vm.is_profile_completed = vm.tab1.form.email ? true : false;
            }

            //default payment method
            vm.tab2.default = CurrentCompany.data.default_payment_method_id;

            if (typeof $window.localStorage.company_data != 'undefined') {
                formService.generateForm(vm.tab1.form, JSON.parse($window.localStorage.company_data));
                delete $window.localStorage.company_data;
            }

            if (vm.tab1.form.vatin != '') {
                vm.tab1.other_contact_address = true;
                vm.tab1.edit = true
            } else {
                vm.tab1.other_contact_address = false;
                vm.tab1.edit = false
            }

            initLogotype(CurrentCompany.data);

            refreshCompany();

            tableService.setVariables(vm.tab4);

            for (var i in Roles.data) {
                vm.tab4.roles[Roles.data[i].id] = Roles.data[i];
                vm.tab4.editable_roles = Roles.data.filter(function (role) {
                    return ['developer', 'client', 'admin'].indexOf(role.name) !== -1;
                });
            }
            getUsers();

            //open add user
            if (typeof $stateParams.user != 'undefined' ) {
                angular.forEach(Roles.data, function (value) {
                    if (value.name == $stateParams.user) {
                        vm.tab_selected = 3;
                        newUser(undefined, value.id);
                    }
                });
            }

            $auth.getUser(function (user) {
                vm.user = user;
            });

            $auth.getMyRole(function (role) {
                paymentService.setVariables(vm, role, $scope);
                vm.user_role = role;
            });

            //vatReleaseReasons
            angular.forEach(VatReleaseReasons.data, function (value) {
                vm.tab1.vat_release_reasons[value.id] = value;
            })

            if ($rootScope.invoices_active) {
                api.company.jpk.get({}, function (response) {
                    formService.generateForm(vm.tab10.form, response.data);
                });
            }

            //add new package
            if (typeof $stateParams.package != 'undefined' ) {
                vm.tab_selected = 4;
            }

            if ($stateParams.first) {
                vm.tab1.first = true;
            }

            //integrations
            tableService.setVariables(vm.tab7);
            getIntegrations();

            //integrations project
            tableService.setVariables(vm.tab7_projects);
            vm.tab7_projects.query.integration_id = null;
            getIntegrationsProjects();

            api.integrations.list.get({limit:200, active:1}, function (response) {
                vm.tab7_projects.types = response.data;
            });

            //integrations users
            tableService.setVariables(vm.tab7_users);
            getIntegrationsUsers();
        }

        function initLogotype(response) {
            if (response.logotype && response.logotype != '') {
                $timeout(function() {
                    vm.tab1.logotype = '';
                    vm.tab1.logotype = __env.apiUrl + 'companies/get-logotype?selected_company_id=' + $auth.getCurrentCompany() + '&token=' + $window.localStorage.token + '&t=' + moment().unix();
                    vm.tab1.logotype_loaded = true;
                }, 400);
            } else {
                vm.tab1.logotype = '';
                vm.tab1.logotype_loaded = false;
            }
            vm.tab1.form.logotype = null;
        }

        function responseError() {
            vm.tab1.msg_error = transService.translate('ERRORS.RESPONSE');
            vm.tab2.msg_error = transService.translate('ERRORS.RESPONSE');
            vm.tab3.msg_error = transService.translate('ERRORS.RESPONSE');
            vm.tab4.msg_error = transService.translate('ERRORS.RESPONSE');
            vm.tab5.msg_error = transService.translate('ERRORS.RESPONSE');
        }

        function addLogo() {
            $timeout(function() {
                angular.element('#file-to-upload').trigger('click');
            }, 100);
        }

        function getInvoiceSettings() {
            api.invoiceSettings.get({}, function (response) {

                if (response.data.invoice_registries.data.length) {
                    vm.tab3.invoice_registries = response.data.invoice_registries.data;

                    //add default if not exist
                    var has_default = false;
                    angular.forEach(vm.tab3.invoice_registries, function (value) {
                        if (value.default) {
                            has_default = true;
                        }
                    });

                    if (!has_default) {
                        vm.tab3.invoice_registries[0].default = 1;
                    }

                } else {
                    vm.tab3.invoice_registries = [{
                        invoice_format_id: '',
                        name: 'Default',
                        prefix: '',
                        start_number: 1,
                        default: 1,
                        is_used: 0,
                    }]
                }

                vm.tab3.form.default_invoice_gross_counted = response.data.default_invoice_gross_counted;

                //default_payment_term_days
                vm.tab3.term_days = response.data.default_payment_term_days ? response.data.default_payment_term_days : 7;
                if ([7, 14, 30, 90].indexOf(vm.tab3.term_days) == -1) {
                    vm.tab3.term_custom = vm.tab3.term_days;
                    vm.tab3.term_days = 'd';
                }

                angular.forEach(vm.tab3.invoice_registries, function (value) {
                    value.default = value.default == 1;
                });

            }, responseError)
        }

        function copyToContact() {
            vm.tab1.form.contact_address_street = vm.tab1.form.main_address_street;
            vm.tab1.form.contact_address_number = vm.tab1.form.main_address_number;
            vm.tab1.form.contact_address_city = vm.tab1.form.main_address_city;
            vm.tab1.form.contact_address_zip_code = vm.tab1.form.main_address_zip_code;
            vm.tab1.form.contact_address_country = vm.tab1.form.main_address_country;
        }

        function getIntegrationsProjects() {
            vm.tab7_projects.promise = api.integrations.projects.get(vm.tab7_projects.query, function (response) {
                vm.tab7_projects.integrations = response.data;
                vm.tab7_projects.pagination = response.meta.pagination;
            }).$promise;
        }

        function getIntegrations() {
            vm.tab7.promise = api.integrations.list.get(vm.tab7.query, function (response) {
                vm.tab7.integrations = response.data;
                vm.tab7.pagination = response.meta.pagination;
            }).$promise;
        }

        function addIntegration(e) {
            dialogService.customDialog(e, 'addEditIntegrationDialogController', 'app/main/company/edit/add-edit-integration/add-edit-integration.html', {}, getIntegrations, getIntegrations);
        }

        function refreshProjectsList() {
            api.integrations.refresh.put({integration_id: vm.tab7_projects.query.integration_id},
                // success
                function(response) {
                    vm.tab7_projects.msg_error = '';
                    vm.tab7_projects.msg_success = transService.translate('COMPANY_EDIT.INTEGRATIONS_PROJECTS.SUCCESS');
                    vm.request_sending = false;
                    formService.formUp();
                },
                // error
                function(response) {
                    vm.tab7_projects.msg_error = transService.getErrorMassage(response);
                    vm.tab7_projects.msg_success = '';
                    vm.request_sending = false;
                    formService.formUp();
                }
            );
        }

        function addIntegrationProject(integration) {
            if (integration.project.data) {
                dialogService.confirm(null, 'COMPANY_EDIT.INTEGRATIONS_PROJECTS.QUESTION', function() {
                    dialogService.customDialog(null, 'addEditIntegrationProjectDialogController', 'app/main/company/edit/add-edit-integration-project/add-edit-integration-project.html', {integration: integration}, getIntegrationsProjects, getIntegrationsProjects);
                });
            } else {
                dialogService.customDialog(null, 'addEditIntegrationProjectDialogController', 'app/main/company/edit/add-edit-integration-project/add-edit-integration-project.html', {integration: integration}, getIntegrationsProjects, getIntegrationsProjects);
            }
        }

        function getIntegrationsUsers() {
            vm.tab7_users.promise = api.integrations.users.get(vm.tab7_users.query, function (response) {
                vm.tab7_users.users = response.data;
                vm.tab7_users.pagination = response.meta.pagination;
            }).$promise;
        }

        function checkErrors(name) {
            $timeout(function () {
                angular.forEach(vm.tab1.scope_form.$error, function (field) {
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

        function changeNumbering(index) {
            if (vm.tab3.year_registry_id != vm.tab3.invoice_registries[index].invoice_format_id) {
                vm.tab3.invoice_registries[index].start_number = null;
            }
        }

        function sendTab1() {
            vm.request_sending = true;
            apiErrorsService.clear('#editCompanyTab1', vm);
            $location.hash('');

            if (!vm.tab1.edit && !vm.tab1.other_contact_address) {
                copyToContact();
            }

            if (vm.tab1.form.website == null) {
                vm.tab1.form.website = '';
            }

            if (vm.tab1.form.website != '' && vm.tab1.form.website.indexOf('http://') != 0 && vm.tab1.form.website.indexOf('https://') != 0) {
                vm.tab1.form.website = 'http://' + vm.tab1.form.website;
            }
            var form = angular.copy(vm.tab1.form);
            form.logotype = vm.tab1.form.logotype;
            form.bank_accounts = null;

            if (!form.logotype) {
                delete form.logotype;
            }

            api.company.company.put(form,
                // success
                function(response) {
                    vm.is_profile_completed = true;

                    getInvoiceSettings();
                    vm.tab1.msg_error = '';
                    vm.tab1.msg_success = transService.translate('COMPANY_EDIT.SUCCESS');
                    vm.request_sending = false;

                    vm.tab1.edit = true;
                    vm.tab1.other_contact_address = true;

                    $rootScope.current_company_nip = response.data.vatin;
                    $rootScope.vat_payer = response.data.vat_payer;

                    if ($stateParams.first) {
                        vm.tab_selected = 1;
                    } else {
                        formService.formUp();
                    }

                    // refresh data on other tabs
                    $timeout(function() {
                        refreshCompany();
                    }, 100);
                },
                // error
                function(response) {
                    apiErrorsService.show('#editCompanyTab1', response, vm, []);
                    vm.tab1.msg_error = transService.getErrorMassage(response);
                    vm.tab1.msg_success = '';
                    vm.request_sending = false;
                    formService.formUp();
                },
                // progress
                function(progress) {
                    vm.tab1.progress = progress;
                }
            );
        }

        function sendTab3() {
            vm.request_sending = true;
            apiErrorsService.clear('#editCompanyTab3', vm);
            $location.hash('');

            //set term
            if (vm.tab3.term_days == 'd') {
                vm.tab3.form.default_payment_term_days = vm.tab3.term_custom;
            } else {
                vm.tab3.form.default_payment_term_days = vm.tab3.term_days;
            }

            var is_repeating = false;
            var is_reserved = false;
            vm.tab3.form.invoice_registries = angular.copy(vm.tab3.invoice_registries);
            angular.forEach(vm.tab3.invoice_registries, function (item, key) {
                if (['PRO', 'ZAL', 'KOR', 'KOR/ZAL'].indexOf(item.prefix.toUpperCase()) > -1) {
                    is_reserved = true;
                }

                angular.forEach(vm.tab3.invoice_registries, function (item2, key2) {
                    if (key != key2 && item.prefix == item2.prefix) {
                        is_repeating = true;
                    }
                });

                if (item.is_used || !item.invoice_format_id || vm.tab3.year_registry_id !== item.invoice_format_id) {
                    vm.tab3.form.invoice_registries[key].start_number = null;
                }
            });

            if (is_reserved) {
                vm.tab3.msg_error = transService.translate('COMPANY_EDIT.RESERVED_ERROR');
                vm.tab3.msg_success = '';
                formService.formUp();
                vm.request_sending = false;
            } else if (is_repeating) {
                vm.tab3.msg_error = transService.translate('COMPANY_EDIT.PREFIX_ERROR');
                vm.tab3.msg_success = '';
                formService.formUp();
                vm.request_sending = false;
            } else {
                api.invoiceSettings.put(vm.tab3.form,
                    // success
                    function () {
                        vm.tab3.msg_error = '';
                        vm.tab3.msg_success = transService.translate('COMPANY_EDIT.SUCCESS');
                        vm.request_sending = false;
                        getInvoiceSettings();
                        if ($stateParams.first) {
                            vm.tab_selected = 5;
                        } else {
                            formService.formUp();
                        }
                    },
                    // error
                    function (response) {
                        apiErrorsService.show('#editCompanyTab3', response, vm, []);
                        vm.tab3.msg_error = transService.getErrorMassage(response);
                        vm.tab3.msg_success = '';
                        vm.request_sending = false;
                        formService.formUp();
                    }
                );
            }
        }

        function sendTab10() {
            vm.request_sending = true;
            apiErrorsService.clear('#editCompanyTab10', vm);
            $location.hash('');

            if (vm.tab10.form.building_number === '') {
                vm.tab10.form.building_number = null;
            }

            if (vm.tab10.form.flat_number === '') {
                vm.tab10.form.flat_number = null;
            }

            api.company.jpk.put(vm.tab10.form,
                // success
                function(response) {
                    vm.tab10.msg_error = '';
                    vm.tab10.msg_success = transService.translate('COMPANY_EDIT.SUCCESS');
                    vm.request_sending = false;

                    if ($stateParams.first) {
                        vm.tab_selected = 4;
                    } else {
                        formService.formUp();
                    }
                },
                // error
                function(response) {
                    apiErrorsService.show('#editCompanyTab10', response, vm, []);
                    vm.tab10.msg_error = transService.getErrorMassage(response);
                    vm.tab10.msg_success = '';
                    vm.request_sending = false;
                    formService.formUp();
                }
            );
        }

        function setDefaultMethod(id) {
            dialogService.confirm(null, 'COMPANY_EDIT.DEFAULT_METHOD_QUESTION', function() {
                api.paymentsMethod.setDefault.put({default_payment_method_id:id}, function () {
                    vm.tab2.msg_success = transService.translate('COMPANY_EDIT.DEFAULT_METHOD_SUCCESS');
                    vm.tab2.msg_error = '';
                    init();
                    if ($stateParams.first) {
                        vm.tab_selected = 2;
                    }

                },function (response) {
                    vm.tab2.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function addRegister() {
            if (vm.tab3.invoice_registries.length < 9) {
                vm.tab3.invoice_registries.push({
                    invoice_format_id: '',
                    name: 'register ' + (vm.tab3.invoice_registries.length + 1),
                    prefix: '',
                    start_number: 1,
                    default: false,
                    is_used: 0,
                });
            }
        }

        function delRegister(index) {
            if (vm.tab3.invoice_registries.length > 1) {
                if (vm.tab3.invoice_registries[index].default) {
                    vm.changeDefaultRegister(index ? 0 : 1);
                }
                vm.tab3.invoice_registries.splice(index, 1);
            }
        }

        function changeDefaultRegister(current_index) {
            if (vm.tab3.invoice_registries[current_index].default != false) {
                angular.forEach(vm.tab3.invoice_registries, function (address, index) {
                    if (index != current_index && vm.tab3.invoice_registries[index].default != false) {
                        vm.tab3.invoice_registries[index].default = false;
                    }
                })
            } else {
                vm.tab3.invoice_registries[current_index].default = true;
            }
        }

        function getUsers(add_success) {
            if (typeof add_success != 'undefined') {
                vm.tab4.msg_success = transService.translate(vm.create_user ? 'COMPANY_EDIT.USER.ADD_SUCCESS' : 'COMPANY_EDIT.USER.INVITE_SUCCESS');
            }
            // Fetch invited
            if (vm.tab4.selected_status == 0) {
                api.company.myInvitations.get({}, function (response) {
                    vm.tab4.users = response.data;
                }).$promise;
            } else {
            // Fetch company users (that arleady accept invitation)
                vm.tab4.promise = api.company.users.get({
                    company_status: vm.tab4.selected_status
                }, function (response) {
                    vm.tab4.users = response.data;
                    // vm.tab4.pagination = response.meta.pagination;
                }).$promise;
            }
        }

        function newUser(e, role_id) {

            $auth.getSettings(function (settings) {
                if (settings['general.multiple_users'] != 'unlimited' &&
                  settings['general.multiple_users'] <= vm.tab4.users.length) {
                    $rootScope.packageAlert('COMPANY_EDIT.USER.TOO_MANY');
                } else {
                    var values = {
                        user: null,
                        role_id: typeof role_id != 'undefined' ? role_id : 0
                    };
                    dialogService.customDialog(e, 'AddEditUserDialogController', 'app/main/company/edit/add-edit-user/add-edit-user.html', values, getUsers, getUsers);
                }
            });
        }

        function deleteUser(id) {
            dialogService.confirm(null, 'COMPANY_EDIT.USER.DELETE_QUESTION', function() {
                api.company.userDelete.delete({id:id}, function () {
                    vm.tab4.msg_success = transService.translate('COMPANY_EDIT.USER.DELETE_SUCCESS');
                    vm.tab4.msg_error = '';
                    getUsers();

                },function (response) {
                    vm.tab4.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function editUser(index,e) {
            var values = {
                user: vm.tab4.users[index],
                role_id: 0
            };
            dialogService.customDialog(e, 'AddEditUserDialogController', 'app/main/company/edit/add-edit-user/add-edit-user.html', values, getUsers, getUsers);
        }

        function userRoleIsEditable(role_id) {
            var role_editable = false;
            angular.forEach(vm.tab4.editable_roles, function(role) {
                if (role.id == role_id && role_editable == false) {
                    role_editable = true;
                }
            });

            return role_editable;
        }

        function getUserProjects(user) {
            vm.tab4.user_projects.list = [];
            vm.tab4.user_projects.loading = true;
            api.projects.get({ status: 'opened' }, function (res) {
                var projects = res.data;
                var promises = [];
                angular.forEach(projects, function (project) {
                    var promise = api.projectUsers.get({ id: project.id, user_id: user.id }).$promise;
                    promises.push(promise);
                });
                Promise.all(promises).then(function (resources) {
                    var result = [];
                    angular.forEach(resources, function (resource) {
                        if (resource.data && resource.data.length) {
                            var project_name = '';
                            angular.forEach(projects, function (project) {
                                if (project.id === resource.data[0].project_id) {
                                    project_name = project.name;
                                }
                            })
                            result.push({
                                id: resource.data[0].project_id,
                                name: project_name,
                                role: resource.data[0].role.data.name || null
                            });
                        }
                    });
                    vm.tab4.user_projects.loading = false;
                    $timeout(function () {
                        vm.tab4.user_projects.list = result;
                    }, 300);
                }, function () {
                    vm.tab4.user_projects.loading = false;
                });
            });
        }

        function addBankAccount() {
            vm.tab1.form.bank_accounts.push({
                id: null,
                number: '',
                bank_name: '',
                default: false
            });
        }

        function deleteBankAccount() {
            if (vm.tab1.form.bank_accounts.length <= 1) {
                return;
            }
            // if already deleting item is default, set first on list as default
            if (vm.tab1.form.bank_accounts[vm.tab1.form.bank_accounts.length-1].default == true) {
                vm.tab1.form.bank_accounts[0].default = true;
            }
            vm.tab1.form.bank_accounts.pop();
        }

        function changeDefaultBankAccount(current_index) {
            if (vm.tab1.form.bank_accounts[current_index].default == false) {
                angular.forEach(vm.tab1.form.bank_accounts, function (bank_account, index) {
                    vm.tab1.form.bank_accounts[index].default = index == current_index ? true : false;
                });
            }
        }

        /**
         * Takes role id, returns role name ready to translate
         * @param {int} role_id
         */
        function getRoleName(role_id) {
            var role_name = '';
            angular.forEach(vm.tab4.roles, function(role) {
                if(role.id == role_id)
                    role_name = role.name;
            });

            return role_name;
        }

        /**
         * Sets new user role
         * @param {int} role_id
         */
        function setNewRole(user_id, role_id, successCallback, apiErrorCallback) {
            var params = {
                user_id: user_id,
                role_id: role_id
            };
            api.company.users.put(params,
                // success
                function() {
                    angular.forEach(vm.tab4.users, function(user) {
                        if (user.id == user_id) user.company_role_id = role_id;
                    });
                    if (typeof successCallback != 'undefined') {
                        successCallback();
                    }
                },
                // error
                function(response) {
                    if (typeof apiErrorCallback != 'undefined') {
                        apiErrorCallback(response.data);
                    }
                }
            );
        }

        function filterUserThroughRole(user) {
            return vm.tab4.selected_role ?
                user.company_role_id === vm.tab4.selected_role :
                true;
        }

        /**
         * Refreshes company data and pastes its into variables
         */
        function refreshCompany() {
            api.currentCompany.get({}, function (response) {
                formService.generateForm(vm.tab1.form, response.data, true);
                if (vm.tab1.form.main_address_country == '') {
                    vm.tab1.form.main_address_country = 'POLSKA';
                    vm.tab1.form.contact_address_country = 'POLSKA';
                }

                //default payment method
                vm.tab2.default = response.data.default_payment_method_id;

                if (typeof $window.localStorage.company_data != 'undefined') {
                    formService.generateForm(vm.tab1.form, JSON.parse($window.localStorage.company_data));
                    delete $window.localStorage.company_data;
                }

                if (vm.tab1.form.vatin != '') {
                    vm.tab1.other_contact_address = true;
                    vm.tab1.edit = true;
                } else {
                    vm.tab1.other_contact_address = false;
                    vm.tab1.edit = false;
                }

                initLogotype(response.data);
                vm.tab1.form.remove_logotype = false;

                // load settings values
                // md-switch need true/false, 1/0 not working
                vm.tab9.company = {
                    enable_calendar: response.data.enable_calendar ? true : false,
                    force_calendar_to_complete: response.data.force_calendar_to_complete ? true : false,
                    enable_activity: response.data.enable_activity ? true : false
                };

            }, responseError);
        }

        /**
         * Apply changes from 'Settings' tab
         * @param {string} option
         */
        function changeSettings() {
            vm.tab9.request_sending = true;

            if(vm.tab9.company.enable_calendar == false) {
                vm.tab9.company.force_calendar_to_complete = false;
            }

            api.company.settings.put(vm.tab9.company,
                function() {
                    vm.tab9.msg_error = '';
                    vm.tab9.request_sending = false;
                    vm.tab9.msg_success = transService.translate('COMPANY_EDIT.SUCCESS');
                    // show state immediately
                    $rootScope.current_company_settings = vm.tab9.company;
                    refreshMenu();
                    // refresh data on other tabs
                    refreshCompany();
                },
                function(response) {
                    vm.tab9.msg_success = '';
                    vm.tab9.request_sending = false;
                    vm.tab9.msg_error = transService.getErrorMassage(response);
                });

            // hide seccess messages with delay
            $timeout(function() {
                vm.tab9.msg_success = '';
            }, 3000);
        }


        function refreshMenu() {
            // remove items from menu
            menu.projects(false);
            // load with updated values
            $auth.refreshUser(function (user) {
                $auth.getSettings(function (settings) {
                    menu.projects(settings['projects.active'], user.selected_user_company.data.role.data.name);
                    menu.invoices(settings['invoices.active'], settings['receipts.active']);
                });
            });
        }


    }
})();
