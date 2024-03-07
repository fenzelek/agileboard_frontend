(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('InvoicesSuccessSaveDialogController', InvoicesSuccessSaveDialogController);

    /** @ngInject */
    function InvoicesSuccessSaveDialogController(api, apiErrorsService, transService, $window, $mdDialog, $location, $auth, $state, invoice, type, page)
    {
        transService.loadFile('main/invoices/success_save');

        var vm = this;
        vm.msg_error = '';
        vm.msg_success = '';
        vm.invoice = invoice;
        vm.page = page;
        vm.form_email_anabled = false;
        vm.request_sending = false;
        vm.form = {
            id: invoice.id,
            email: ''
        },

        vm.pdf = pdf;
        vm.email = email;
        vm.cancelForm = cancelForm;
        vm.edit = edit;
        vm.list = list;
        vm.add_new = add_new;

        init();

        function init() {
            if (!page) {
                vm.form_email_anabled = true;
            }

            if (typeof invoice.invoice_contractor != 'undefined') {
                vm.form.email = invoice.invoice_contractor.data.email;
            }
        }

        function pdf() {
            $window.open(
                __env.apiUrl + 'invoices/' + vm.invoice.id + '/pdf?' +
                'token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function email() {
            vm.request_sending = true;
            apiErrorsService.clear('#sendInvoiceEmail', vm);

            api.invoiceSendMail.save(vm.form,
                // success
                function() {
                    vm.request_sending = false;
                    vm.msg_success = transService.translate('INVOICES_SUCCESS_SAVE.SEND_SUCCESS');
                },
                // error
                function(response) {
                    apiErrorsService.show('#sendInvoiceEmail', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                }
            );
        }

        function cancelForm() {
            if (page) {
                vm.form_email_anabled = false
            } else {
                $mdDialog.hide();
            }
        }

        function edit() {
            if (page == 'edit') {
                $state.reload();
            } else {
                $location.path('/invoices/form/edit/' + vm.invoice.id);
            }

            $mdDialog.hide(true);
        }

        function list() {
            $location.path('/invoices/list');
            $mdDialog.hide(true);
        }

        function add_new() {
            if (page == 'new') {
                $state.reload();
            } else {
                if (!type) {
                    api.invoiceTypes.get({}, function (response) {
                        angular.forEach(response.data, function (item) {
                            if (item.id == vm.invoice.invoice_type_id) {
                                type = item.slug;
                            }
                        });
                        $location.path('/invoices/form/new/type/' + type);
                    });

                } else {
                    $location.path('/invoices/form/new/type/' + type);
                }
            }

            $mdDialog.hide(true);
        }
    }

})();
