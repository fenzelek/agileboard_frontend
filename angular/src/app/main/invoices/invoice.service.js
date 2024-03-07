(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('invoiceService', invoiceService);

    /** @ngInject */
    function invoiceService(transService, api, dialogService, $window, $timeout, $rootScope)
    {
        var vm = null;
        var scope = null;
        var add_product_id = 0;
        var add_contractor_id = 0;

        var service = {
            init:init,
            getNewObjItem:getNewObjItem,
            getNewObjTax:getNewObjTax,
            getMarginProcedures:getMarginProcedures,
            getReverseChanges:getReverseChanges,
            getInvoiceSettingAndFormats:getInvoiceSettingAndFormats,
            setPaymentDate:setPaymentDate,
            setPaymentDateFull:setPaymentDateFull,
            calculate:calculate,
            setBankAccount: setBankAccount
        };

        return service;

        function init(tmp_vm, tmp_scope) {
            vm = tmp_vm;
            scope = tmp_scope;
            
            vm.msg_error = '';
            vm.msg_success = '';
            vm.request_sending = false;
            vm.type = '';
            vm.contractor = null;
            vm.search_text_contractor = '';
            vm.payment_methods = {};
            vm.payment_date = '';
            vm.taxes = {};
            vm.units = {};
            vm.services = {};
            vm.margin_procedures = {};
            vm.reverse_changes = {};
            vm.disabled_payment_date = false;
            vm.today = moment().format('YYYY-MM-DD');
            vm.start_callendar = moment().add(-180, 'days').format('YYYY-MM-DD');
            vm.stop_callendar = moment().add(180, 'days').format('YYYY-MM-DD');
            vm.show_description = false;

            //data only for edit/add
            vm.company = {};
            vm.registries = [];
            vm.current_method = null;
            vm.title = '';
            vm.invoice_formats = {};
            vm.is_extra_item = false;
            vm.custom_name_products_enable = false;
            vm.addresses_delivery_enabled = false;
            vm.delivery_contractor = null;
            vm.search_text_delivery_contractor = '';
            vm.tax_type_np_id = 0; //id tax type "np."
            vm.special_payment = false;

            //form
            vm.form = {
                correction_type: '',
                sale_date: vm.today,
                issue_date: vm.today,
                price_net: '',
                price_gross: '',
                vat_sum: '',
                payment_term_days: '',
                contractor_id: null,
                payment_method_id: '',
                bank_account_id: '',
                invoice_type_id: '',
                gross_counted: true,
                corrected_invoice_id: '',
                delivery_address_id: -1,
                default_delivery: false,
                invoice_registry_id: 0,
                description: '',
                invoice_margin_procedure_id: 0,
                invoice_reverse_charge_id: 0,
                items: [],
                taxes: []
            };

            vm.round = round;
            vm.responseError = responseError;
            vm.searchContractor = searchContractor;
            vm.searchProducts = searchProducts;
            vm.clearCustomName = clearCustomName;
            vm.changeContractorDelivery = changeContractorDelivery;
            vm.changeSpecialPayment = changeSpecialPayment;
            vm.selectedAutocompleteProduct = selectedAutocompleteProduct;
            vm.addNewProduct = addNewProduct;
            vm.selectedAutocompleteContractor = selectedAutocompleteContractor;
            vm.addNewContractor = addNewContractor;
            vm.addProduct = addProduct;
            vm.deleteProduct = deleteProduct;
            vm.productWatch = productWatch;
        }

        /**
         * return new item object
         */
        function getNewObjItem() {
            return {
                current_service: null,
                search_text: '',
                watch: null,
                company_service_id: '',
                service_unit: null,
                service_unit_id: '',
                custom_name: '',
                custom_name_enable: false,
                price_net: 0,
                price_net_sum: 0,
                price_gross: 0,
                price_gross_sum: 0,
                vat_rate_id: null,
                vat_sum: '',
                quantity: 1
            };
        }

        /**
         * return new tax object
         */
        function getNewObjTax() {
            return {
                price_net: 0,
                price_gross: 0,
                vat_rate_id: ''
            }
        }

        /**
         * Round to 2 decimal places
         *
         * @param number
         * @returns {number}
         */
        function round(number) {
            if (isNaN(number))
                return 0;
            return Math.round(number * 100) / 100;
        }

        /**
         * show response error
         */
        function responseError() {
            vm.msg_error = transService.translate('ERRORS.RESPONSE');
        }

        /**
         * get contractors list for autocomplete
         *
         * @param name
         */
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

        /**
         * get products list for autocomplete
         *
         * @param name
         */
        function searchProducts(name) {
            return api.products.get({
                    limit: 15,
                    page: 1,
                    name: name
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        /**
         * Clear custom item name
         *
         * @param item
         */
        function clearCustomName(item) {
            item.custom_name = '';
            item.custom_name_enable = false;
        }

        /**
         * load margin procedures
         */
        function getMarginProcedures() {
            api.invoiceMarginProcedures.get({}, function (response) {
                vm.margin_procedures = response.data;
            }, responseError);
        }

        /**
         * load reverse changes
         */
        function getReverseChanges() {
            api.invoiceReverseCharges.get({}, function (response) {
                vm.reverse_changes = response.data;
            }, responseError);
        }

        /**
         * load invoice formats and invoice registry with callback
         *
         * @param callback
         */
        function getInvoiceSettingAndFormats(callback) {
            //registry
            api.invoiceFormats.get({}, function (response) {

                angular.forEach(response.data, function (value) {
                    vm.invoice_formats[value.id] = value;
                });

                api.invoiceSettings.get({}, function (response) {
                    vm.registries = response.data.invoice_registries.data;

                    if (typeof callback != 'undefined') {
                        callback();
                    }

                }, responseError);

            }, responseError);
        }

        /**
         * run before change contractor delivery - set default delivery address
         */
        function changeContractorDelivery() {
            if (vm.delivery_contractor && vm.delivery_contractor.addresses.data && vm.delivery_contractor.addresses.data.length > 0) {
                vm.form.delivery_address_id = -1;
                angular.forEach(vm.delivery_contractor.addresses.data, function (obj) {
                    if (obj.default) {
                        vm.form.delivery_address_id = obj.id;
                    }
                });
                if (vm.form.delivery_address_id == -1) {
                    vm.form.delivery_address_id = vm.delivery_contractor.addresses.data[0].id;
                }
            }
        }

        /**
         * run before change special payment - clear or add structure for partial payments
         */
        function changeSpecialPayment() {
            if (vm.special_payment) {
                vm.form.special_payment = {
                    amount: '',
                    payment_method_id: null
                }
            } else {
                delete vm.form.special_payment;
            }
        }

        /**
         * select field item autocomplete (onclick)
         * save id for adding new product
         *
         * @param index
         */
        function selectedAutocompleteProduct(index) {
            add_product_id = index;
        }

        /**
         * Open modal for add new product from field autocomplete
         * if product added then set current_service for selected field
         */
        function addNewProduct() {
            dialogService.customDialog(null, 'ProductsFormController', 'app/main/products/form/modal.html', null, function (data) {
                vm.form.items[add_product_id].current_service = data;
            });
        }

        /**
         * select field contractor autocomplete (onclick)
         * save id for adding new contractor
         *
         * @param index
         */
        function selectedAutocompleteContractor(index) {
            add_contractor_id = index;
        }

        /**
         * Open modal for add new product from field autocomplete
         * if contractor added then set contractor or delivery_contractor
         */
        function addNewContractor() {

            //get search text and if this is nip then save to local storage for use in form adding contractor
            var text = vm.search_text_delivery_contractor;
            if (add_contractor_id == 'contractor') {
                text = vm.search_text_contractor;
            }

            var re = /^((\d{3}-\d{3}-\d{2}-\d{2})|(\d{3}-\d{2}-\d{2}-\d{3})|([0-9]{10}))$/;
            var found = text.match(re);

            if (found) {
                $window.localStorage.nip_new_contractor = text;
            }

            dialogService.customDialog(null, 'ContractorsFormController', 'app/main/contractors/form/modal.html', null, function (data) {
                if (add_contractor_id == 'contractor') {
                    vm.contractor = data;
                } else {
                    vm.delivery_contractor = data;
                }
            });
        }

        /**
         * set payment date
         *
         * @param payment_term_days
         */
        function setPaymentDate(payment_term_days) {
            vm.payment_date = moment(vm.form.issue_date).add(payment_term_days, 'days').format('YYYY-MM-DD');
        }

        /**
         * set payment date according to conditions
         */
        function setPaymentDateFull() {
            if (vm.current_method && vm.contractor && vm.company) {
                if (['gotowka', 'karta', 'payu'].indexOf(vm.current_method.slug) == -1) {
                    if (vm.contractor.default_payment_term_days) {
                        setPaymentDate(vm.contractor.default_payment_term_days);
                    } else {
                        setPaymentDate(vm.company.default_payment_term_days);
                    }
                } else {
                    setPaymentDate(0);
                }
            }
        }

        /**
         * Add new empty product to items list
         *
         * @returns {number}
         */
        function addProduct() {
            vm.form.items.push(getNewObjItem());

            var index = vm.form.items.length - 1;

            if (vm.type == 'margin' || vm.type == 'reverse_charge' || !$rootScope.vat_payer) {
                vm.form.items[index].vat_rate_id = vm.tax_type_np_id;
            }

            /**
             * change product
             */
            vm.form.items[index].watch = productWatch(index);

            return vm.form.items.length - 1;
        }

        /**
         * Delete selected product
         *
         * @param index
         */
        function deleteProduct(index) {
            //stop watching
            angular.forEach(vm.form.items, function (item) {
                if (item.watch) {
                    item.watch();
                }
            });

            vm.form.items.splice(index, 1);

            $timeout(function () {
                angular.forEach(vm.form.items, function (item, key) {
                    item.watch = vm.productWatch(key);
                });
            });
        }

        /**
         * Run when selected product was changed
         *
         * @param index
         */
        function productWatch(index) {
            return scope.$watchCollection(function () {return vm.form.items[index];},function(new_obj, old_obj){

                if (!vm.is_extra_item && typeof new_obj != 'undefined') {
                    //find changed key
                    var changed_key = null;
                    angular.forEach(new_obj, function (value, key) {
                        if (value != old_obj[key] && !changed_key) {
                            //permitted keys
                            if (['current_service', 'price_net', 'price_gross', 'vat_rate_id', 'quantity', 'service_unit_id'].indexOf(key) > -1) {
                                changed_key = key;
                            }
                        }
                    });


                    //change service
                    //set company_service_id, vat_rate_id, service_unit_id, service_unit, price_gross/price_net
                    if (new_obj.current_service && changed_key == 'current_service') {
                        //change service
                        new_obj.company_service_id = new_obj.current_service.id;

                        if (!old_obj.current_service || new_obj.current_service.id != old_obj.current_service.id) {

                            //service_unit_id, service_unit
                            new_obj.service_unit_id = new_obj.current_service.service_unit_id;
                            angular.forEach(vm.units, function (item) {
                                if (item.id == new_obj.service_unit_id)
                                    new_obj.service_unit = item;
                            });

                            //vat_rate_id, price_gross, price_net
                            if (vm.type != 'margin' && vm.type != 'reverse_charge') {

                                if ($rootScope.vat_payer) {
                                    new_obj.vat_rate_id = new_obj.current_service.vat_rate_id;
                                }

                                if (vm.form.gross_counted) {
                                    new_obj.price_gross = new_obj.current_service.price_gross;
                                } else {
                                    new_obj.price_net = new_obj.current_service.price_net;
                                }
                            } else {
                                if (vm.form.gross_counted) {
                                    new_obj.price_gross = new_obj.current_service.price_net;
                                } else {
                                    new_obj.price_net = new_obj.current_service.price_net;
                                }
                            }
                        }
                    }

                    //set service_unit when changed service_unit_id
                    if (changed_key == 'service_unit_id') {
                        angular.forEach(vm.units, function (item) {
                            if (item.id == new_obj.service_unit_id)
                                new_obj.service_unit = item;
                        });
                    }

                    //set price_gross_sum, price_gross_sum, price_net, price_gross, vat_sum
                    if (new_obj.current_service && typeof new_obj.quantity != 'undefined' && new_obj.quantity > 0 && new_obj.vat_rate_id) {

                        var vat = vm.taxes[new_obj.vat_rate_id].rate;

                        //run only for selected variables
                        if (vm.form.gross_counted) {
                            new_obj.price_gross_sum = vm.round(new_obj.price_gross * new_obj.quantity);
                            new_obj.price_net = vm.round(new_obj.price_gross / (1 + (vat / 100) ));
                            new_obj.price_net_sum = vm.round(new_obj.price_gross_sum / (1 + (vat / 100) ));
                        } else {
                            new_obj.price_net_sum = vm.round(new_obj.price_net * new_obj.quantity);
                            new_obj.price_gross = vm.round(new_obj.price_net * (1 + (vat / 100) ));
                            new_obj.price_gross_sum = vm.round(new_obj.price_net_sum * (1 + (vat / 100) ));
                        }

                        new_obj.vat_sum = vm.round(new_obj.price_gross_sum - new_obj.price_net_sum);

                        calculate();
                    }
                }
            });
        }

        /**
         * Calculate global taxes, price_gross, price_net
         */
        function calculate() {

            //calculate all types taxes and price_gross/price_net in this types
            vm.form.taxes = [];

            angular.forEach(vm.form.items, function (item) {

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

                    var new_tax = getNewObjTax();
                    new_tax.vat_rate_id = item.vat_rate_id;
                    if (vm.form.gross_counted) {
                        new_tax.price_gross = item.price_gross_sum;
                    } else {
                        new_tax.price_net = item.price_net_sum;
                    }

                    vm.form.taxes.push(new_tax);
                }
            });

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

        /**
         * @param {object} company 
         * @param {int} bank account id 
         */
        function setBankAccount(company, bank_account) {
            if (bank_account && bank_account.data) {
                vm.form.bank_account_id = bank_account.data.id;
            } else if (company.bank_accounts) {
                // set default bank account
                angular.forEach(company.bank_accounts.data, function (bank_account) {
                    if (bank_account.default == true) {
                        vm.form.bank_account_id = bank_account.id;
                    }
                });
            }
        }

    }
})();
