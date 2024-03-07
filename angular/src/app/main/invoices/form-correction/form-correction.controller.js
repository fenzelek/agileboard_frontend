(function ()
{
    'use strict';

    angular
        .module('app.invoices-form-correction')
        .controller('InvoicesFormCorrectionController', InvoicesFormCorrectionController);

    /** @ngInject */
    function InvoicesFormCorrectionController(transService, api, dialogService, formService, apiErrorsService, $location, $scope, invoiceService, InvoiceCorrectionTypesList, TaxesList, UnitsList, PaymentMethodsList, Invoice, InvoiceTypesList, CurrentCompany)
    {
        var vm = this;
        transService.loadFile('main/invoices/form-correction');

        // Data
        vm.correction_types = {};
        vm.taxes_old = [];
        vm.payment_method_slug = '';

        vm.send = send;
        vm.addProductCorrection = addProductCorrection;
        vm.deleteProductCorrection = deleteProductCorrection;

        init();

        function init() {

            invoiceService.init(vm);
            vm.units = UnitsList.data;
            vm.payment_methods = PaymentMethodsList.data;
            vm.company = CurrentCompany.data;
            vm.correction_types = InvoiceCorrectionTypesList.data;

            formService.generateForm(vm.form, Invoice.data);
            vm.form.issue_date = vm.today;
            vm.form.sale_date = vm.today;
            vm.form.corrected_invoice_id = Invoice.data.id;

            //taxes
            angular.forEach(TaxesList.data, function (item) {
                vm.taxes[item.id] = item;
            });

            //margin procedures
            invoiceService.getMarginProcedures();

            //set vm.type based on default invoice type
            vm.type = 'correction';
            angular.forEach(InvoiceTypesList.data, function (item) {
                if (vm.form.invoice_type_id == item.id) {
                    if (item.slug == 'margin') {
                        vm.type = 'margin_correction';
                    } else if (item.slug == 'reverse_charge') {
                        vm.type = 'reverse_charge_correction';
                    }
                }

            });

            //set vm.form.invoice_type_id based on vm.type
            angular.forEach(InvoiceTypesList.data, function (item) {
                if (item.slug == vm.type) {
                    vm.form.invoice_type_id = item.id;
                }
            });

            //set payment date
            invoiceService.setPaymentDate(vm.form.payment_term_days);

            // set bank account id
            invoiceService.setBankAccount(vm.company, Invoice.data.bank_account);

            //load items
            angular.forEach(vm.form.items, function (item, key) {

                vm.form.items[key].service_unit = vm.form.items[key].service_unit.data;

                delete vm.form.items[key].paid;
                delete vm.form.items[key].invoice;

                (function (key) {
                    api.product.get({id:item.company_service_id}, function (response_product) {
                        vm.form.items[key].new_obj = false;
                        vm.form.items[key].is_correction = false;
                        vm.form.items[key].current_service = response_product.data;

                        vm.form.items[key].custom_name_enable = vm.form.items[key].custom_name != null && vm.form.items[key].custom_name != '';
                        if (!vm.form.items[key].custom_name_enable) {
                            vm.form.items[key].custom_name = '';
                        }
                    })
                }(key));

            });

            //load contractor
            api.contractor.get({id:vm.form.contractor_id}, function (response) {
                vm.contractor = response.data;
            }, vm.responseError);

            /**
             * change issue_date
             */
            $scope.$watch(function () {return vm.form.issue_date;},function(value){
                if (value) {
                    if (['gotowka', 'karta', 'payu'].indexOf(vm.payment_method_slug) > -1) {
                        vm.payment_date = vm.form.issue_date;
                    }
                }
            });

            /**
             * change payment_method_id
             */
            $scope.$watch(function () {return vm.form.payment_method_id;},function(value){
                angular.forEach(vm.payment_methods, function (item) {
                    if (item.id == value) {
                        vm.payment_method_slug = item.slug;
                        if (item.slug == 'gotowka' || item.slug == 'karta' || item.slug == 'payu') {
                            vm.payment_date = vm.form.issue_date;
                            vm.disabled_payment_date = true;
                        } else {
                            vm.disabled_payment_date = false;
                        }
                    }
                })

            });

            /**
             * change gross_counted
             */
            $scope.$watch(function () {return vm.form.gross_counted;},calculateCorrection);

            /**
             * change products
             */
            $scope.$watchCollection(function () {return vm.form.items;},calculateCorrection);
        }

        /**
         * Create new invoice
         */
        function send() {

            //confirm action
            dialogService.confirm(null, 'INVOICES_FORM_CORRECTION.ADD_QUESTION', function() {

                $location.hash('');
                vm.request_sending = true;
                apiErrorsService.clear('#invoiceProduct', vm);

                //clear unnecessary elements
                var form = angular.copy(vm.form);

                var quantity_error = false;

                for(var i = form.items.length - 1; i >= 0; --i) {
                    if (!form.items[i].new_obj) {
                        //delete items from based invoice
                        form.items.splice(i, 1);
                    } else {
                        delete form.items[i].current_service;
                        delete form.items[i].search_text;
                        delete form.items[i].watch;
                        delete form.items[i].new_obj;
                        delete form.items[i].is_correction;

                        if (!form.items[i].quantity) {
                            quantity_error = true;
                            break;
                        }
                    }
                }

                //if any quantity is 0
                if (quantity_error) {
                    vm.msg_error = transService.translate('INVOICES_FORM_CORRECTION.QUANTITY_ERROR');
                    vm.msg_success = '';
                    formService.formUp();
                } else {

                    form.contractor_id = vm.contractor.id;//set contractor id
                    form.payment_term_days = moment(vm.payment_date).diff(vm.form.issue_date, 'days'); //calculate payment_term_days

                    if (!vm.show_description) {
                        form.description = '';
                    }

                    api.invoices.save(form,
                        // success
                        function (response) {
                            //show modal with info success and actions for selected
                            dialogService.customDialog(null, 'InvoicesSuccessSaveDialogController', 'app/main/invoices/success_save/success_save.html',
                                {invoice:response.data, type:null, page: 'new-correction'},
                                undefined, function () {$location.path('/invoices/list');});
                        },
                        // error
                        function (response) {
                            apiErrorsService.show('#invoiceProduct', response, vm, []);
                            vm.msg_error = transService.getErrorMassage(response);
                            vm.msg_success = '';
                            vm.request_sending = false;
                            formService.formUp();
                        }
                    );
                }

            });
        }

        /**
         * Add product for correction
         *
         * @param index
         * @returns {number}
         */
        function addProductCorrection(index) {

            //set default values
            ++index;
            vm.form.items.splice(index, 0, invoiceService.getNewObjItem());
            vm.form.items[index].current_service = vm.form.items[index - 1].current_service;
            vm.form.items[index].company_service_id = vm.form.items[index - 1].company_service_id;
            vm.form.items[index].custom_name = vm.form.items[index - 1].custom_name;
            vm.form.items[index].custom_name_enable = vm.form.items[index - 1].custom_name_enable;
            vm.form.items[index].vat_rate_id = vm.form.items[index - 1].vat_rate_id;
            vm.form.items[index].quantity = (vm.form.correction_type == 'quantity' ? -1 : 1) * vm.form.items[index - 1].quantity;
            vm.form.items[index].price_net = vm.form.items[index - 1].price_net;
            vm.form.items[index].price_net_old = vm.form.items[index - 1].price_net;
            vm.form.items[index].price_gross = vm.form.items[index - 1].price_gross;
            vm.form.items[index].price_gross_old = vm.form.items[index - 1].price_gross;
            vm.form.items[index].service_unit_id = vm.form.items[index - 1].service_unit_id;
            vm.form.items[index].service_unit = vm.form.items[index - 1].service_unit;
            vm.form.items[index].position_corrected_id = vm.form.items[index - 1].id;
            vm.form.items[index].new_obj = true;
            vm.form.items[index].is_correction = false;
            vm.form.items[index - 1].is_correction = true;


            /**
             * Run when product was changed
             */
            vm.form.items[index].watch = $scope.$watchCollection(function () {return vm.form.items[index];},function(new_obj, old_obj){

                if (typeof new_obj == 'undefined')
                    return;

                //find changed key
                var changed_key = null;
                angular.forEach(new_obj, function (value, key) {
                    if (value != old_obj[key] && !changed_key) {
                        //permitted keys
                        if (['price_net', 'price_gross', 'vat_rate_id', 'quantity'].indexOf(key) > -1) {
                            changed_key = key;
                        }
                    }
                });

                //set price_gross_sum, price_gross_sum, price_net, price_gross, vat_sum
                if (new_obj.current_service && typeof new_obj.quantity != 'undefined' && new_obj.vat_rate_id) {

                    var vat = vm.taxes[new_obj.vat_rate_id].rate;
                    //run only for selected variables
                    if (vm.form.gross_counted) {
                        var price_gross = vm.form.correction_type == 'price' ? new_obj.price_gross - new_obj.price_gross_old : new_obj.price_gross;

                        new_obj.price_gross_sum = vm.round(price_gross * new_obj.quantity);
                        new_obj.price_net = vat ? vm.round(price_gross / (1 + (vat / 100) )) : new_obj.price_gross;
                        new_obj.price_net_sum = vm.round(new_obj.price_gross_sum / (1 + (vat / 100) ));
                    } else {
                        var price_net = vm.form.correction_type == 'price' ? new_obj.price_net - new_obj.price_net_old : new_obj.price_net;

                        new_obj.price_net_sum = vm.round(price_net * new_obj.quantity);
                        new_obj.price_gross = vat ? vm.round(price_net * (1 + (vat / 100) )) : new_obj.price_net;
                        new_obj.price_gross_sum = vm.round(new_obj.price_net_sum * (1 + (vat / 100) ));
                    }

                    new_obj.vat_sum = vm.round(new_obj.price_gross_sum  - new_obj.price_net_sum );

                    calculateCorrection();
                }
            });

            return vm.form.items.length - 1;
        }

        /**
         * delete correction
         *
         * @param index
         */
        function deleteProductCorrection(index) {

            if (vm.form.items[index].new_obj) {
                vm.form.items[index - 1].is_correction = false;
            }

            vm.deleteProduct(index);
        }

        /**
         * Calculate global taxes, price_gross, price_net
         */
        function calculateCorrection() {

            //calculate all types taxes and price_gross/price_net in this types
            vm.form.taxes = [];

            angular.forEach(vm.form.items, function (item) {

                if (item.new_obj) {

                    //add value to tax
                    var found = false;
                    angular.forEach(vm.form.taxes, function (value, key) {
                        if (item.vat_rate_id != null && item.vat_rate_id == value.vat_rate_id) {
                            if (vm.form.gross_counted) {
                                value.price_gross += item.price_gross_sum;
                            } else {
                                value.price_net += item.price_net_sum;
                            }

                            found = true;
                        }
                    });

                    //new tax
                    if (!found && item.vat_rate_id != null) {

                        var new_tax = invoiceService.getNewObjTax();
                        new_tax.vat_rate_id = item.vat_rate_id;
                        if (vm.form.gross_counted) {
                            new_tax.price_gross = item.price_gross_sum;
                        } else {
                            new_tax.price_net = item.price_net_sum;
                        }

                        vm.form.taxes.push(new_tax);
                    }
                }
            });


            //tax correction
            if (vm.form.correction_type == 'tax') {

                //calculate all types taxes and price_gross/price_net in this types before changed taxes
                vm.taxes_old = [];

                angular.forEach(vm.form.items, function (item) {

                    if (!item.new_obj && item.is_correction) {

                        //add value to tax
                        var found = false;
                        angular.forEach(vm.taxes_old, function (value, key) {
                            if (item.vat_rate_id != null && item.vat_rate_id == value.vat_rate_id) {
                                value.price_gross += item.price_gross_sum;
                                value.price_net += item.price_net_sum;

                                found = true;
                            }
                        });

                        //new tax
                        if (!found && item.vat_rate_id != null) {

                            var new_tax = invoiceService.getNewObjTax();
                            new_tax.vat_rate_id = item.vat_rate_id;
                            new_tax.price_gross = item.price_gross_sum;
                            new_tax.price_net = item.price_net_sum;

                            vm.taxes_old.push(new_tax);
                        }
                    }
                });


                //sum after edited
                angular.forEach(vm.taxes_old, function (tax) {
                    var found = false;
                    for (var i = 0; i < vm.form.taxes.length; ++i) {
                        if (vm.form.taxes[i].vat_rate_id == tax.vat_rate_id) {
                            vm.form.taxes[i].price_gross -= tax.price_gross;
                            vm.form.taxes[i].price_net -= tax.price_net;
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        var new_tax = invoiceService.getNewObjTax();
                        new_tax.vat_rate_id = tax.vat_rate_id;
                        new_tax.price_gross = -1 * tax.price_gross;
                        new_tax.price_net = -1 * tax.price_net;
                        vm.form.taxes.push(new_tax);
                    }
                });
            }

            //global sum price_net, price_gross, vat_sum
            vm.form.price_net = 0;
            vm.form.price_gross = 0;
            vm.form.vat_sum = 0;
            if (vm.form.gross_counted) {
                angular.forEach(vm.form.taxes, function (value) {
                    value.price_net = vm.round(value.price_gross / (1 + (vm.taxes[value.vat_rate_id].rate / 100) ));
                    vm.form.price_net += value.price_net;
                    vm.form.price_gross += value.price_gross;
                    vm.form.vat_sum += vm.round((value.price_gross - value.price_net));
                });
            } else {
                angular.forEach(vm.form.taxes, function (value) {
                    value.price_gross = vm.round(value.price_net * (1 + (vm.taxes[value.vat_rate_id].rate / 100) ));
                    vm.form.price_net += value.price_net;
                    vm.form.price_gross += value.price_gross;
                    vm.form.vat_sum += vm.round((value.price_gross - value.price_net));
                });
            }
        }

        //////////
    }
})();
