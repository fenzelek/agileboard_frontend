(function ()
{
    'use strict';

    angular
        .module('app.invoices-list')
        .controller('InvoicesListController', InvoicesListController);

    /** @ngInject */
    function InvoicesListController(transService, api, tableService, $httpParamSerializer, $window, $auth, $location,
                                    dialogService, $rootScope, InvoicesList, InvoiceTypesList, InvoicesReportList,
                                    InvoiceFilters, InvoiceSettings, InvoiceFormats, __env)
    {
        var vm = this;
        transService.loadFile('main/invoices/list');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.invoices = InvoicesList.data;
        vm.pagination = InvoicesList.meta.pagination;
        vm.reports = InvoicesReportList.data;
        vm.filters = InvoiceFilters.data;
        vm.registries = InvoiceSettings.data.invoice_registries.data;
        vm.types = [];
        vm.type = null;
        vm.correction_ids = [];
        vm.id_type_correction = 0;
        vm.id_type_margin_correction = 0;
        vm.id_type_proforma = 0;
        vm.contractor = null;
        vm.is_proforma = false;
        vm.is_margin = false;
        vm.is_tax_office = false;
        vm.search_text = '';
        vm.is_loading = true;
        vm.invoice_formats = [];

        angular.forEach(InvoiceFormats.data, function (value) {
            vm.invoice_formats[value.id] = value;
        });

        vm.getInvoices = getInvoices;
        vm.filterInvoices = filterInvoices;
        vm.searchContractor = searchContractor;
        vm.selectAdd = selectAdd;
        vm.pdf = pdf;
        vm.pdfAll = pdfAll;
        vm.archiveAll = archiveAll;
        vm.invoicesZips = invoicesZips;
        vm.payments = payments;
        vm.paymentsAdd = paymentsAdd;
        vm.cancel = cancel;
        vm.mail = mail;
        vm.goTo = goTo;
        vm.isCorrection = isCorrection;
        vm.moment = moment;

        init();

        function init() {
            $auth.getSettings(function (settings) {
                vm.is_proforma = settings['invoices.proforma.enabled'] == "1";
                vm.is_margin = settings['invoices.margin.enabled'] == "1";
                vm.reverse_charge = settings['invoices.reverse.charge.enabled'] == "1";

                vm.is_loading = false;
            });

            vm.correction_ids = [];

            //invoice types
            var data = InvoiceTypesList.data;
            for(var i in data) {
                vm.types[data[i].id] = data[i];

                if (data[i].slug == 'correction' ||
                    data[i].slug == 'margin_correction' ||
                    data[i].slug == 'reverse_charge_correction') {
                    vm.correction_ids.push(data[i].id);
                }

                if (data[i].slug == 'proforma') {
                    vm.id_type_proforma = data[i].id;
                }
            }

            tableService.setVariables(vm);
            vm.query.number = null;
            vm.query.contractor_id = null;
            vm.query.status = 'all';
            vm.query.invoice_registry_id = null;
            vm.query.date_start = '';
            vm.query.date_end = '';
            vm.query.sort = '-id';

            $auth.getMyRole(function (role) {
                vm.is_tax_office = role == 'tax_office';
            })
        }

        function getInvoices() {
            if (vm.query.number == '') {
                vm.query.number = null;
            }

            vm.promise = api.invoices.get(vm.query, function (response) {
                vm.invoices = response.data;
                vm.pagination = response.meta.pagination;
            }).$promise;

            api.reports.invoices.get(vm.query, function (response) {
                vm.reports = response.data;
            });
        }

        function searchContractor(name) {

            return api.contractors.get({
                    limit: 15,
                    page: 1,
                    search: name
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        function filterInvoices() {

            if (vm.contractor) {
                vm.query.contractor_id = vm.contractor.id;
            } else {
                vm.query.contractor_id = null;
            }

            getInvoices();
        }

        function selectAdd() {
            if (vm.type) {
                if (vm.type == 'proforma' && !vm.is_proforma) {
                    $rootScope.packageAlert('PACKAGE_ALERT.DEFAULT_MESSAGE');
                    vm.type = null;
                    return;
                }
                if (vm.type == 'margin' && !vm.is_margin) {
                    $rootScope.packageAlert('PACKAGE_ALERT.DEFAULT_MESSAGE');
                    vm.type = null;
                    return;
                }
                if (vm.type == 'reverse_charge' && !vm.reverse_charge) {
                    $rootScope.packageAlert('PACKAGE_ALERT.DEFAULT_MESSAGE');
                    vm.type = null;
                    return;
                }

                goTo('form/new/type/' + vm.type);
            }
        }

        function pdf(id, duplicate) {
            var params = $httpParamSerializer(vm.query);
            $window.open(
                __env.apiUrl + 'invoices/' + id + '/pdf?' + params +
                '&token=' + $window.localStorage.token +
                '&duplicate=' + duplicate +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function pdfAll() {
            var params = $httpParamSerializer(vm.query);
            $window.open(
                __env.apiUrl + 'invoices/pdf?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }
        
        function archiveAll() {
            if (vm.pagination.total > 50) {
                dialogService.alert(null, 'INVOICES_LIST.INVOICES_ARCHIVE_EXCEEDED');
                return;
            }

            api.invoicesZip.get(vm.query, function () {
                dialogService.customDialog(null, 'InvoicesZipPendingDialogController', 'app/main/invoices/list/zip_pending_dialog/zip_pending_dialog.html', {}, function(go_to_zips) {
                    if (go_to_zips) {
                        invoicesZips();
                    }
                });
            }, function (response) {
                vm.msg_error = transService.getErrorMassage(response);
            })
            
        }

        function invoicesZips(e) {
            dialogService.customDialog(e, 'InvoicesZipDownloadDialogController', 'app/main/invoices/list/zip_download_dialog/zip_download_dialog.html', {});
        }

        function payments(id) {
            dialogService.customDialog(null, 'InvoicesPaymentsDialogController', 'app/main/invoices/payments/payments.html', {id:id, is_tax_office:vm.is_tax_office}, function (id) {
                if (id) {
                    dialogService.confirm(null, 'INVOICES_LIST.PAYMENTS.DELETE_QUESTION', function () {
                        api.invoicePayment.delete({id: id}, function () {
                            vm.msg_success = transService.translate('INVOICES_LIST.PAYMENTS.DELETE_SUCCESS');
                            vm.msg_error = '';
                            getInvoices();

                        }, function (response) {
                            vm.msg_error = transService.getErrorMassage(response);
                        })
                    });
                }
            });
        }

        function cancel(id) {
            dialogService.confirm(null, 'INVOICES_LIST.CANCEL_QUESTION', function() {
                api.invoice.delete({id:id},
                    // success
                    function(response) {
                        vm.msg_error = '';
                        vm.msg_success = transService.translate('INVOICES_LIST.CANCEL_SUCCESS');
                        getInvoices();
                    },
                    // error
                    function(response) {
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                    }
                );
            });
        }

        function paymentsAdd(id, amount) {
            dialogService.customDialog(null, 'InvoicesPaymentsAddDialogController', 'app/main/invoices/add-payment/add-payment.html', {id:id, amount:amount}, function (success) {
                if (success == true) {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate('INVOICES_LIST.PAYMENTS.SUCCESS');
                    getInvoices();
                }
            });
        }

        function mail(invoice) {
            dialogService.customDialog(null, 'InvoicesSuccessSaveDialogController', 'app/main/invoices/success_save/success_save.html', {invoice:invoice, type:null, page: false});
        }

        function goTo(path) {
            $location.path('/invoices/' + path);
        }
        
        function isCorrection(id) {
            return vm.correction_ids.indexOf(id) != -1;
        }

        //////////
    }
})();
