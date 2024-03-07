(function ()
{
    'use strict';

    angular
        .module('app.my-list')
        .controller('MyListController', MyListController);

    /** @ngInject */
    function MyListController($window, transService, api, $auth, dialogService, $location, $stateParams, $rootScope)
    {
        var vm = this;
        transService.loadFile('main/company/my-list');

        // Data
        vm.companies = [];
        vm.invitations = [];
        vm.msg_error = '';
        vm.is_pending = false;
        vm.num_owners = 0;

        vm.selectCompany = selectCompany;
        vm.createCompanyDialog = createCompanyDialog;
        vm.accept = accept;
        vm.reject = reject;

        init();

        // Methods
        function init() {
            $auth.refreshCompanies(function (companies) {
                vm.companies = companies;

                angular.forEach(vm.companies, function (company) {
                    if (company.role.data.name == 'owner') {
                        ++vm.num_owners;
                    }
                    getLogotype(company);
                });

                api.company.myInvitations.get({active:1}, function (response) {
                    vm.invitations = response.data;

                    for (var i = 0; i < vm.invitations.length; ++i) {
                        if (vm.invitations[i].status == 0) {
                            vm.is_pending = true;
                            break;
                        }
                    }

                    if ($stateParams.open != 'open' && vm.companies.length == 1 && !vm.is_pending) {
                        $auth.redirectToDashboard();
                    } else if (vm.companies.length == 0 && vm.invitations.length == 0) {

                        // create company from user email address
                        if(!$rootScope.is_fv && __env.create_company_from_email) {
                            $auth.getUser(function (user) {
                                api.company.company.save( { name: user.email, vat_payer: true },
                                    function(response) {
                                        selectCompany(response.data.id, '1');
                                    }, function(response) {
                                        vm.msg_error = transService.getErrorMassage(response);
                                });
                            });
                        } else {
                            $location.path('company/new');
                        }

                    }
                });

            });

        }

        function getLogotype(company) {
            // set placeholder image first
            company.logo = '/assets/images/logos/company-inv.png';
            // fetch company logo and override placeholder if logo exists
            var logo_url = __env.apiUrl + 'companies/get-logotype/' + company.id + '?selected_company_id=' + company.id + '&token=' + $window.localStorage.token;
            var image = new Image();
            image.src = logo_url;
            image.onload = function () {
                company.logo = logo_url;
            }
        }

        function selectCompany(id, enabled) {
            if (enabled == '1') {
                $auth.setCurrentCompany(id, function () {
                    $auth.refreshUser(function (user) {
                        $auth.redirectToDashboard();
                    })
                });
            }
        }

        /**
         * accept invitation
         * @param token
         */
        function accept(token) {
            dialogService.confirm(null, 'COMPANY_MY_LIST.ACCEPT_QUESTION', function() {
                api.company.acceptInvitation.put({token:token}, function () {

                    vm.msg_error = '';
                    init();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        /**
         * reject invitation
         * @param token
         */
        function reject(token) {
            dialogService.confirm(null, 'COMPANY_MY_LIST.REJECT_QUESTION', function() {
                api.company.rejectInvitation.put({token:token}, function () {

                    vm.msg_error = '';
                    init();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }


        function createCompanyDialog(e) {
            dialogService.confirm(e, 'COMPANY_MY_LIST.CREATE_COMPANY_DIALOG', function() {
                $auth.getUser(function (user) {
                    api.company.company.save( { name: user.email, vat_payer: true },
                        function(response) {
                            selectCompany(response.data.id, '1');
                        }, function(response) {
                            vm.msg_error = transService.getErrorMassage(response);
                    });
                });
            });
        }


        //////////
    }
})();
