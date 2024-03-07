(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('paymentService', paymentService);

    /** @ngInject */
    function paymentService(tableService, api, dialogService, transService, $location, $rootScope)
    {
        var vm = {};

        var service = {
            setVariables: setVariables,
            getPayments: getPayments,
            forceTest:forceTest,
        };

        return service;

        function setVariables(t_vm, role, scope) {
            vm = t_vm;

            vm.tab11 = {
                msg_error: '',
                msg_success: '',
                currency: 'PLN',
                packages: {},
                packages_current: {},
                additional_modules: {},
                used: {},
                isFreeMod:isFreeMod,
                selectedModGetError:selectedModGetError,
                getSelectedMod:getSelectedMod,
                isActiveInOtherPackage:isActiveInOtherPackage,
                getMods:getMods,
                getModule:getModule,
                getCountMods:getCountMods,
                getPriceChangeModule:getPriceChangeModule,
                togglePackage:togglePackage,
                toggleModules:toggleModules,
                cancelSubscription:cancelSubscription,
                replaceModuleSlug:replaceModuleSlug,
                disableModule:disableModule,
                renewPackage:renewPackage,
                changePackage:changePackage,
                testPackage:testPackage,
                calculate:calculate,
                canTest:canTest,
                canChange:canChange,
                canRenew:canRenew,
                canTestModule:canTestModule,
                canChangeModule:canChangeModule,
                canRenewModule:canRenewModule,
                enableDaysRenewModule:enableDaysRenewModule,
                modHasError:modHasError,
                gePriceMod:gePriceMod,
                testModule:testModule,
                renewModule:renewModule,
                changeModule: changeModule,
                moduleValueIncreased: moduleValueIncreased
            };

            //language
            if (transService.getLanguage() != 'pl') {
                vm.tab11.currency = 'EUR';
            }

            var translateChangeSuccess = $rootScope.$on('$translateChangeSuccess', function(event, current, previous) {
                var last_currency = vm.tab11.currency;
                vm.tab11.currency = transService.getLanguage() != 'pl' ? 'EUR' : 'PLN'

                if (last_currency != vm.tab11.currency) {
                    if (role == 'owner') {
                        api.packages.get({currency: vm.tab11.currency}, function (response) {
                            vm.tab11.packages = response.data;
                            angular.forEach(vm.tab11.packages, function (item) {
                                item.selected_days = 30;
                            });
                        })
                    }
                }
            });

            // Cleanup
            scope.$on('$destroy', function ()
            {
                translateChangeSuccess()
            })

            vm.tab13 = {
                msg_error: '',
                msg_success: '',
                status: null,
                payments: [],
                pagination:null,
                cancel: cancel,
                again: again,
                getPayments: getPayments
            };

            tableService.setVariables(vm.tab13);

            getPayments();

            if (role == 'owner') {

                api.packagesCurrent.get({}, function (response) {
                    vm.tab11.packages_current = response.data;
                    vm.tab11.packages_current.selected_days = 30
                })

                api.packages.get({currency: vm.tab11.currency}, function (response) {
                    vm.tab11.packages = response.data;
                    angular.forEach(vm.tab11.packages, function (item) {
                        item.selected_days = 30;
                    });
                })

                api.modulesLimits.get({}, function (response) {
                    vm.tab11.used = response.data;
                })
            }
        }

        function replaceModuleSlug(slug) {
            return slug.replace(/\./g, '-');
        }

        function isFreeMod(module) {
            return ['0', '', 0].indexOf(getSelectedMod(module).value) != -1;
        }

        function getSelectedMod(module) {
            var mod = null
            angular.forEach(module.mods.data, function (item) {
                if (module.selected_mod == item.id) {
                    mod = item
                }
            });

            return mod;
        }

        function selectedModGetError(module) {
            var error = getSelectedMod(module).error;
            if (error == 'module_mod_currently_used' || error == 'module_mod_currently_used_can_extend') {
                return false
            }

            return error;
        }

        function isActiveInOtherPackage(module) {
            var mod = getSelectedMod(module);
            if ((mod.error == 'module_mod_currently_used' || mod.error == 'module_mod_currently_used_can_extend')
                && ['0', '', 0].indexOf(mod.value) == -1){
                return true;
            }

            return false;
        }

        function getMods(module) {
            var mods = [];
            angular.forEach(vm.tab11.packages_current.modules_list, function (item) {
                if (item.slug == module.slug) {
                    mods = item.mods.data;
                }
            })
            return mods;
        }

        function getModule(module) {
            var selected_module = null;
            angular.forEach(vm.tab11.packages_current.modules_list, function (item) {
                if (item.slug == module.slug) {
                    selected_module = item;
                }
            })
            return selected_module;
        }

        function getCountMods(module) {
            var count = null;
            angular.forEach(module.mods.data, function (item) {
                if (!item.test) {
                    ++count
                }
            })
            return count;
        }

        function getPriceChangeModule(module, id, full, pack) {
            var price = 0;
            if (!pack) {
                pack = vm.tab11.packages_current;
            }
            if (module.hasOwnProperty('mods')) {
              var full_module = module;
            } else {
              var full_module = getModule(module);
            }

            angular.forEach(full_module.mods.data, function (mod) {
                if (mod.id == id) {
                    angular.forEach(mod.mod_prices.data, function (mod_price) {
                        if (mod_price.days == pack.selected_days && mod_price.currency == vm.tab11.currency) {
                            price = full ? mod_price.price : mod_price.price_change;
                        }
                    });
                }
            });

            return price;
        }

        function moduleValueIncreased(module) {
            var company_value = parseInt(module.company_module.data.value);
            var selected_value = parseInt(getSelectedMod(getModule(module)).value);

            return selected_value > company_value;
        }

        function togglePackage(selected_package, with_switch) {
            if (with_switch) {
                selected_package.togglePackage = !selected_package.togglePackage
            }

            if (selected_package.togglePackage) {
                api.package.get({id: selected_package.id}, function (response) {
                    selected_package.modules_list = response.data;

                    //selected mod default
                    angular.forEach(selected_package.modules_list, function (module) {
                        module.selected_mod = null;
                        //preliminary select
                        angular.forEach(module.mods.data, function (mod) {
                            if (!mod.test && !module.selected_mod) {
                                module.selected_mod = mod.id;
                            }
                        })
                        //select if is used
                        angular.forEach(module.mods.data, function (mod) {
                            if (!mod.test && (mod.error == 'module_mod_currently_used' || mod.error == 'module_mod_currently_used_can_extend')) {
                                module.selected_mod = mod.id;
                            }
                        })
                    })

                    calculate(selected_package);
                })
            }
        }

        function toggleModules(with_switch) {
            if (with_switch) {
                vm.tab11.additional_modules.toggled = !vm.tab11.additional_modules.toggled;
            }

            if (vm.tab11.additional_modules.toggled) {
                vm.tab11.additional_modules.current = null
                vm.tab11.additional_modules.available = null
                api.modulesCurrent.get({}, function (response) {
                    vm.tab11.additional_modules.current = response.data;
                    prepareModules();
                });
                api.modulesAvailable.get({}, function (response) {
                    vm.tab11.additional_modules.available = response.data;

                    angular.forEach(vm.tab11.additional_modules.available, function (module) {
                        module.selected_days = 30;
                        module.selected_mod = module.mods.data[0].id;
                        angular.forEach(module.mods.data, function (mod) {
                            if (mod.error == 'module_mod_currently_used' || mod.error == 'module_mod_currently_used_can_extend') {
                                module.selected_mod = mod.id;
                            }
                        })
                    });
                    prepareModules();
                });
            }
        }

        function prepareModules() {
            if (vm.tab11.additional_modules.current && vm.tab11.additional_modules.available) {
                angular.forEach(vm.tab11.additional_modules.current, function (current) {
                    angular.forEach(vm.tab11.additional_modules.available, function (available) {
                        if (current.module_id == available.id) {
                            current.module.data = available;
                            available.hide = true;
                        }
                    });
                })
            }
        }

        function cancelSubscription(id, selected_package) {
            dialogService.confirm(null, 'COMPANY_EDIT.PACKAGES.CANCEL_SUBSCRIPTION_QUESTION', function() {
                api.subscription.delete({subscription_id:id}, function () {
                    vm.tab11.msg_success = transService.translate('COMPANY_EDIT.PACKAGES.CANCEL_SUBSCRIPTION_SUCCESS');
                    vm.tab11.msg_error = '';
                    if (selected_package) {
                        togglePackage(selected_package, false)
                    } else {
                        toggleModules(false);
                    }
                },function (response) {
                    vm.tab11.msg_success = '';
                    vm.tab11.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function renewPackage(selected_package) {
            var params = {
                package_id: selected_package.id,
                days: selected_package.selected_days,
                is_test: 0,
                currency: vm.tab11.currency,
                mod_price: [],
            };

            angular.forEach(selected_package.modules_list, function (module) {
                var found = false;

                angular.forEach(module.mods.data, function (mod) {
                    if (module.selected_mod == mod.id) {
                        angular.forEach(mod.mod_prices.data, function (price) {
                            if (price.checksum && price.days == selected_package.selected_days && price.currency == vm.tab11.currency) {
                                params.mod_price.push({
                                    id: price.id,
                                    checksum: price.checksum
                                })
                                found = true;
                            }
                        });
                    }
                });
            });

            postPackage(params);
        }


        function changePackage(selected_package) {
            var params = {
                package_id: selected_package.id,
                days: 0,
                is_test: 0,
                currency: vm.tab11.currency,
                mod_price: [],
            };

            angular.forEach(selected_package.modules_list, function (module) {
                var found = false;

                angular.forEach(module.mods.data, function (mod) {
                    if (module.selected_mod == mod.id) {
                        angular.forEach(mod.mod_prices.data, function (price) {
                            if (price.checksum_change && price.currency == vm.tab11.currency) {
                                params.mod_price.push({
                                    id: price.id,
                                    checksum: price.checksum_change
                                })
                                found = true;
                            }
                        });
                    }
                });
            });

            postPackage(params);
        }

        function testPackage(selected_package) {
            var params = {
                package_id: selected_package.id,
                days: 30,
                is_test: 1,
                currency: 'PLN',
                mod_price: [],
            };

            angular.forEach(selected_package.modules_list, function (module) {
                var found = false;

                angular.forEach(module.mods.data, function (mod) {
                    if (!found && mod.test && mod.mod_prices.data.length && mod.mod_prices.data[0].checksum && mod.mod_prices.data[0].currency == vm.tab11.currency) {
                        params.mod_price.push({
                            id: mod.mod_prices.data[0].id,
                            checksum: mod.mod_prices.data[0].checksum
                        })
                        found = true;
                    }
                });
            });

            postPackage(params);
        }

        function calculate(selected_package) {
            selected_package.current_price = 0;
            selected_package.current_price_change = 0;
            angular.forEach(selected_package.modules_list, function (module) {
                angular.forEach(module.mods.data, function (mod) {
                    if (module.selected_mod == mod.id) {
                        angular.forEach(mod.mod_prices.data, function (price) {
                            if (selected_package.selected_days == price.days && price.currency == vm.tab11.currency) {
                                selected_package.current_price += price.price;
                            }
                            if (price.checksum_change && price.currency == vm.tab11.currency) {
                                selected_package.current_price_change += price.price_change;
                            }
                        });
                    }
                });
            });
        }

        function testModule(module) {
            var params = {
                days: 30,
                is_test: 1,
                currency: vm.tab11.currency,
                mod_price_id: null,
                checksum: null,
            };

            var found = false;

            angular.forEach(module.mods.data, function (mod) {
                if (!found && mod.test && mod.mod_prices.data.length && mod.mod_prices.data[0].checksum && mod.mod_prices.data[0].currency == vm.tab11.currency) {
                    params.mod_price_id = mod.mod_prices.data[0].id
                    params.checksum = mod.mod_prices.data[0].checksum
                    found = true;
                }
            });

            postModule(params);
        }

        function renewModule(module) {
            var params = {
                days: module.selected_days,
                is_test: 0,
                currency: vm.tab11.currency,
                mod_price_id: null,
                checksum: null,
            };

            var found = false;

            angular.forEach(module.mods.data, function (mod) {
                if (module.selected_mod == mod.id) {
                    angular.forEach(mod.mod_prices.data, function (price) {
                        if (price.days == module.selected_days && price.checksum && price.currency == vm.tab11.currency) {
                            params.mod_price_id = price.id;
                            params.checksum = price.checksum;
                            found = true;
                        }
                    })
                }
            });

            postModule(params);
        }

        function changeModule(module) {
            var params = {
                days: 0,
                is_test: 0,
                currency: vm.tab11.currency,
                mod_price_id: null,
                checksum: null,
            };

            var found = false;

            angular.forEach(module.mods.data, function (mod) {
                if (module.selected_mod == mod.id) {
                    angular.forEach(mod.mod_prices.data, function (price) {
                        if (price.checksum_change && price.currency == vm.tab11.currency) {
                            params.mod_price_id = price.id;
                            params.checksum = price.checksum_change;
                            found = true;
                        }
                    })
                }
            });

            postModule(params);
        }

        function canTest(selected_package) {
            var can_test = true;
            angular.forEach(selected_package.modules_list, function (module) {
                var is_test = false;

                angular.forEach(module.mods.data, function (mod) {
                    if (mod.test && mod.mod_prices.data.length && mod.mod_prices.data[0].checksum) {
                        is_test = true;
                    }
                });

                if (!is_test) {
                    can_test = false;
                }
            });

            return can_test;
        }

        function canChange(selected_package) {
            var can_change = true;
            angular.forEach(selected_package.modules_list, function (module) {
                var is_checksum = false;

                angular.forEach(module.mods.data, function (mod) {
                    if (module.selected_mod == mod.id) {
                        angular.forEach(mod.mod_prices.data, function (price) {
                            if (price.checksum_change) {
                                is_checksum = true;
                            }
                        });
                    }
                });

                if (!is_checksum) {
                    can_change = false;
                }
            });

            return can_change;
        }

        function canRenew(selected_package, days) {
            var can_renew = true;
            angular.forEach(selected_package.modules_list, function (module) {
                var is_checksum = false;

                angular.forEach(module.mods.data, function (mod) {
                    if (module.selected_mod == mod.id) {
                        angular.forEach(mod.mod_prices.data, function (price) {
                            if (price.checksum && price.days == days) {
                                is_checksum = true;
                            }
                        });
                    }
                });

                if (!is_checksum) {
                    can_renew = false;
                }
            });

            return can_renew;
        }

        function canTestModule(module) {
            var is_test = false;

            angular.forEach(module.mods.data, function (mod) {
                if (mod.test && mod.mod_prices.data.length && mod.mod_prices.data[0].checksum) {
                    is_test = true;
                }
            });

            return is_test
        }

        function canChangeModule(module) {
            var is_checksum = false;

            if (module && module.mods) {
                angular.forEach(module.mods.data, function (mod) {
                    if (module.selected_mod == mod.id) {
                        angular.forEach(mod.mod_prices.data, function (price) {
                            if (price.checksum_change) {
                                is_checksum = true;
                            }
                        })
                    }
                });
            }
            return is_checksum
        }

        function canRenewModule(module) {
            var is_checksum = false;

            if (module.mods) {
                angular.forEach(module.mods.data, function (mod) {
                    if (module.selected_mod == mod.id) {
                        angular.forEach(mod.mod_prices.data, function (price) {
                            if (price.days == module.selected_days && price.checksum) {
                                is_checksum = true;
                            }
                        })
                    }
                });
            }
            return is_checksum
        }

        function enableDaysRenewModule(module, days) {
            var is_checksum = false;

            if (module.mods) {
                angular.forEach(module.mods.data, function (mod) {
                    if (module.selected_mod == mod.id) {
                        angular.forEach(mod.mod_prices.data, function (price) {
                            if (price.days == days && price.checksum) {
                                is_checksum = true;
                            }
                        })
                    }
                });
            }
            return is_checksum
        }

        function modHasError(module, error) {
            var has = false;

            if (module.mods) {
                angular.forEach(module.mods.data, function (mod) {
                    if (mod.error == error) {
                        has = true;
                    }
                });
            }
            return has
        }

        function gePriceMod(module, days) {
            var text = '';

            if (module.mods) {
                angular.forEach(module.mods.data, function (mod) {
                    if (module.selected_mod == mod.id) {
                        angular.forEach(mod.mod_prices.data, function (price) {
                            if (price.days == days && price.checksum) {
                                text = (price.price / 100).toFixed(2) + ' ' + price.currency;
                            }
                        })
                    }
                });
            }
            return text
        }

        function postPackage(params) {
            api.package.save(params, function (response) {
                if (response.data.payments.data.length) {
                    $location.url('/company/buy/' + response.data.payments.data[0].id);
                } else {
                    api.packages.get({}, function (res) {
                        vm.tab11.packages = res.data;
                        angular.forEach(vm.tab11.packages, function (item) {
                            item.selected_days = 30;
                        });
                    })
                    api.packagesCurrent.get({}, function (res) {
                        vm.tab11.packages_current = res.data;
                        vm.tab11.packages_current.selected_days = 30
                    })
                }
            },function (response) {
                vm.tab11.msg_success = '';
                vm.tab11.msg_error = transService.getErrorMassage(response);
            });
        }

        function postModule(params) {
            api.modules.save(params, function (response) {
                if (response.data.payments.data.length) {
                    $location.url('/company/buy/' + response.data.payments.data[0].id);
                } else {
                    api.modulesCurrent.get({}, function (response) {
                        vm.tab11.additional_modules.current = response.data;
                    });
                    api.modulesAvailable.get({}, function (response) {
                        vm.tab11.additional_modules.available = response.data;
                    });
                }
            },function (response) {
                vm.tab11.msg_success = '';
                vm.tab11.msg_error = transService.getErrorMassage(response);
            });
        }

        function disableModule(id) {
            dialogService.confirm(null, 'COMPANY_EDIT.PACKAGES.DISABLE_MODULE_QUESTION', function() {
                api.module.delete({id:id}, function () {
                    vm.tab11.msg_success = transService.translate('COMPANY_EDIT.PACKAGES.DISABLE_MODULE_SUCCESS');
                    vm.tab11.msg_error = '';
                    toggleModules(false);
                },function (response) {
                    vm.tab11.msg_success = '';
                    vm.tab11.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function getPayments() {
            api.payments.get({status:vm.tab13.status}, function (response) {
                vm.tab13.payments = response.data;
                vm.tab13.pagination = response.meta.pagination;
            })
        }

        function cancel(id) {
            dialogService.confirm(null, 'COMPANY_EDIT.PAYMENTS.CANCEL_QUESTION', function() {
                api.payment.delete({id:id},
                    // success
                    function(response) {
                        vm.tab13.msg_error = '';
                        vm.tab13.msg_success = transService.translate('COMPANY_EDIT.PAYMENTS.CANCEL_SUCCESS');
                        getPayments();
                    },
                    // error
                    function(response) {
                        vm.tab13.msg_error = transService.getErrorMassage(response);
                        vm.tab13.msg_success = '';
                    }
                );
            });
        }

        function again(transaction_id) {
            api.paymentAgain.save({transaction_id: transaction_id},
                // success
                function(response) {
                    $location.path('/company/buy/' . response.data.id);
                },
                // error
                function(response) {
                    vm.tab13.msg_error = transService.getErrorMassage(response);
                    vm.tab13.msg_success = '';
                }
            );
        }

        function forceTest(name, callback) {
            api.packages.get({}, function (response) {
                //search package_id
                var package_id = null;
                angular.forEach(response.data, function (item) {
                    if (item.slug == name) {
                        package_id = item.id;
                    }
                });

                if (!package_id) {
                    callback(false);
                    return;
                }

                api.package.get({id: package_id}, function (response) {
                    var params = {
                        package_id: package_id,
                        days: 30,
                        is_test: 1,
                        currency: 'PLN',
                        mod_price: [],
                    };

                    angular.forEach(response.data, function (module) {
                        var found = false;

                        angular.forEach(module.mods.data, function (mod) {
                            if (!found && mod.test && mod.mod_prices.data.length && mod.mod_prices.data[0].checksum) {
                                params.mod_price.push({
                                    id: mod.mod_prices.data[0].id,
                                    checksum: mod.mod_prices.data[0].checksum
                                })
                                found = true;
                            }
                        });
                    });

                    api.package.save(params, function () {
                        callback(true)
                    }, function () {
                        callback(false);
                    });
                }, function () {
                    callback(false);
                });

            }, function () {
                callback(false);
            })
        }
    }
})();
