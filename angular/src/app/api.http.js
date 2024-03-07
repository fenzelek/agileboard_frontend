(function() {
	'use strict';

	angular
		.module('CEP')
		.factory('apiHttp', apiHttp);

	/** @ngInject */
	function apiHttp($resource, __env, $multipartForm, $http)
	{
   	    var baseUrl =  __env.apiUrl;

		return {
			version: $resource('/app/data/version/index.json'),

	        quickPanel: {
	            activities: $resource('/app/data/quick-panel/activities.json'),
	            contacts  : $resource('/app/data/quick-panel/contacts.json'),
	            events    : $resource('/app/data/quick-panel/events.json'),
	            notes     : $resource('/app/data/quick-panel/notes.json')
	        },

	        calendar: {
                users: $resource(baseUrl + 'users/availabilities'),
                ticketRealization: $resource(baseUrl + 'ticket-realization'),
				userAvailabilities: $resource(baseUrl + 'users/:user/availabilities/:day', {
					user: '@user',
					day: '@day'
                }),
				userOwnAvailabilities: $resource(baseUrl + 'users/availabilities/own/:day', {
					day: '@day'
                }),
                userWorkload: $resource(baseUrl + 'workload'),
            },

	        auth: {
				authenticate: $resource(baseUrl + 'auth'),
				quick: $resource(baseUrl + 'auth/quick'),
	            passwordReset: $resource(baseUrl + 'password/reset', {}, {
					'put': {method: 'PUT'}
				}),
                create: $resource(baseUrl + 'users'),
				currentUser: $resource(baseUrl + 'users/current')
	        },

			activation: {
				activation: $resource(baseUrl + 'activation', {}, {
					'put': {method: 'PUT', headers: { 'Authorization': false }}
				}),
			recreate: $resource(baseUrl + 'activation/resend', {}, {
					'put': {method: 'PUT'}
				})
			},

			roles: $resource(baseUrl + 'roles'),
			rolesCompany: $resource(baseUrl + 'roles/company'),

			companyMyList: $resource(baseUrl + 'users/current/companies'),
			invoiceFormats: $resource(baseUrl + 'invoice-formats'),
			currentCompany: $resource(baseUrl + 'companies/current'),
			gusCompany: $resource(baseUrl + 'companies/get-gus-data'),
            vatReleaseReasons: $resource(baseUrl + 'vat-release-reasons'),

			company: {
				myInvitations: $resource(baseUrl + 'users/current/invitations'),
				acceptInvitation: $resource(baseUrl + 'companies/invitations/accept', {}, {
					'put': {method: 'PUT', headers: { 'Authorization': false }}
				}),
				rejectInvitation: $resource(baseUrl + 'companies/invitations/reject', {}, {
					'put': {method: 'PUT', headers: { 'Authorization': false }}
				}),
				invite: $resource(baseUrl + 'companies/:company_id/invitations', {company_id:'@company_id'}),
				users: $resource(baseUrl + 'companies/current/users', {}, {'put': {method: 'PUT'}}),
				userDelete: $resource(baseUrl + 'companies/current/users/:id', {id:'@id'}),
				myList: $resource(baseUrl + 'users/current/companies'),
				countries: $resource(baseUrl + 'companies/country-vatin-prefixes'),
                company: $multipartForm.getInstance(baseUrl + 'companies', $http),
                settings: $resource(baseUrl + 'companies/settings', {}, {'put': {method: 'PUT'}}),
				tokens: $resource(baseUrl + 'companies/tokens'),
				token: $resource(baseUrl + 'companies/tokens/:id', {id:'@id'}),
                jpk: $resource(baseUrl + 'companies/jpk_details', {}, {'put': {method: 'PUT'}}),
			},

			invoiceSettings: $resource(baseUrl + 'companies/invoice-settings', {}, {'put': {method: 'PUT'}}),
			invoiceTypes: $resource(baseUrl + 'invoice-types'),
			invoiceFilters: $resource(baseUrl + 'invoice-filters'),
			invoiceMarginProcedures: $resource(baseUrl + 'invoice-margin-procedures'),
			invoiceReverseCharges: $resource(baseUrl + 'invoice-reverse-charges'),
			invoiceCorrectionTypes: $resource(baseUrl + 'invoice-correction-types'),
			invoicePayments: $resource(baseUrl + 'invoice-payments'),
			invoicePayment: $resource(baseUrl + 'invoice-payments/:id', {id:'@id'}),
			invoices: $resource(baseUrl + 'invoices'),
			invoice: $resource(baseUrl + 'invoices/:id', {id:'@id'}, {'put': {method: 'PUT'}}),
			invoiceSendMail: $resource(baseUrl + 'invoices/:id/send', {id:'@id'}),
			invoiceJpkFa: $resource(baseUrl + 'invoices/jpk/fa'),
			invoicesZip: $resource(baseUrl + 'invoices/zip', {}),
			clipboard: $resource(baseUrl + 'clipboard', {}),

			packages: $resource(baseUrl + 'packages'),
			packagesCurrent: $resource(baseUrl + 'packages/current'),
			package: $resource(baseUrl + 'packages/:id', {id:'@id'}),
			modules: $resource(baseUrl + 'modules'),
			module: $resource(baseUrl + 'modules/:id', {id:'@id'}),
			modulesCurrent: $resource(baseUrl + 'modules/current'),
			modulesAvailable: $resource(baseUrl + 'modules/available'),
			modulesLimits: $resource(baseUrl + 'modules/limits'),

			payments: $resource(baseUrl + 'companies/payments'),
			payuCardList: $resource(baseUrl + 'companies/payments/cards'),
			payment: $resource(baseUrl + 'companies/payments/:id', {id:'@id'}),
			paymentAgain: $resource(baseUrl + 'companies/payments/again/:transaction_id', {transaction_id:'@transaction_id'}),
			subscription: $resource(baseUrl + 'companies/payments/subscription/:subscription_id', {subscription_id:'@subscription_id'}),

			taxOffices: $resource(baseUrl + 'tax-offices'),

			paymentsMethod: {
				list: $resource(baseUrl + 'payment-methods'),
				// deleteMethod: $resource(baseUrl + ''),
				setDefault: $resource(baseUrl + 'companies/default-payment-method', {}, {
					'put': {method: 'PUT'}
				}),
				// update: $resource(baseUrl + '', {}, {
				// 	'put': {method: 'PUT'}
				// }),
				// create: $resource(baseUrl + ''),
			},
			users: $resource(baseUrl + 'users'),
			// userUpdate: $resource(baseUrl + 'users/:id', {id:'@id'}, {'put': {method: 'PUT'}}),
			userUpdate: $multipartForm.getInstance(baseUrl + 'users/:id', $http),

			contractor: $resource(baseUrl + 'contractors/:id', {id:'@id'}, {'put': {method: 'PUT'}}),
			contractors: $resource(baseUrl + 'contractors'),
			products: $resource(baseUrl + 'companies/services'),
			product: $resource(baseUrl + 'companies/services/:id', {id:'@id'}, {'put': {method: 'PUT'}}),
			units: $resource(baseUrl + 'companies/service-units'),
			taxs: $resource(baseUrl + 'vat-rates'),

			cashOperations: $resource(baseUrl + 'cash-flows'),
			cashOperation: $resource(baseUrl + 'cash-flows/:id', {id:'@id'}, {'put': {method: 'PUT'}}),
			receipts: $resource(baseUrl + 'receipts'),
			receipt: $resource(baseUrl + 'receipts/:id', {id:'@id'}),
			onlineSales: $resource(baseUrl + 'online-sales'),
			onlineSale: $resource(baseUrl + 'online-sales/:id', {id:'@id'}),
			registryInvoices: $resource(baseUrl + '/reports/invoices-registry'),

			reports: {
				invoices: $resource(baseUrl + 'reports/company-invoices'),
				receipts: $resource(baseUrl + 'reports/receipts'),
				onlineSales: $resource(baseUrl + 'reports/online-sales'),
				cashOperations: $resource(baseUrl + 'reports/cash-flows'),
				registryInvoices: $resource(baseUrl + '/reports/invoices-registry-report'),
			},

			projects: $resource(baseUrl + 'projects'),
			project: $resource(baseUrl + 'projects/:id', {id:'@id'}, {'put': {method: 'PUT'}}),
			projectExist: $resource(baseUrl + 'projects/exist'),
			projectClose: $resource(baseUrl + 'projects/:id/close', {id:'@id'}, {'put': {method: 'PUT'}}),
			projectClone: $resource(baseUrl + 'projects/:id/clone', {id:'@id'}),
			projectUsers: $resource(baseUrl + 'projects/:id/users', {id:'@id'}),
            projectUser: $resource(baseUrl + 'projects/:id/users/:user_id', {id:'@id', user_id:'@user_id'}),
			projectBasicInfo: $resource(baseUrl + 'projects/:id/basic-info', {id:'@id'}),
			projectPrivileges: $resource(baseUrl + 'projects/:id/permissions', {id:'@id'}, {'put': {method: 'PUT'}}),
			files: $resource(baseUrl + 'projects/:project_id/files', {project_id:'@project_id'}),
			file: $resource(baseUrl + 'projects/:project_id/files/:id', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
            filesTypes: $resource(baseUrl + 'projects/files/types'),
			fileUpload: $multipartForm.getInstance(baseUrl + 'projects/:project_id/files', $http),
			directories: $resource(baseUrl + 'project/:project_id/directories', {project_id:'@project_id'}),
			directory: $resource(baseUrl + 'project/:project_id/directories/:id', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
			pages: $resource(baseUrl + 'project/:project_id/pages', {project_id:'@project_id'}),
			page: {
                page: $resource(baseUrl + 'project/:project_id/pages/:id', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
                comment: $resource(baseUrl + 'project/:project_id/pages/comments/:comment_id', {project_id:'@project_id', comment_id:'@comment_id'}, {'put': {method: 'PUT'}, 'delete': {method: 'DELETE'}}),
                comments: $resource(baseUrl + 'project/:project_id/pages/:page_id/comment', {project_id:'@project_id', page_id:'@page_id'}, {'post': {method: 'POST'}}),
            },
			agileStatuses: $resource(baseUrl + 'projects/:project_id/statuses', {project_id:'@project_id'}, {'put': {method: 'PUT'}}),
			agileStatusesList: $resource('/app/data/statuses/statuses_:lang.json', { lang: '@lang'}),
			ticket: {
				types: $resource(baseUrl + 'ticket-types'),
				tickets: $resource(baseUrl + 'projects/:project_id/tickets', {project_id:'@project_id'}),
				ticket: $resource(baseUrl + 'projects/:project_id/tickets/:id', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				show: $resource(baseUrl + 'projects/:project_id/tickets/:id/show', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				hide: $resource(baseUrl + 'projects/:project_id/tickets/:id/hide', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				changePriority: $resource(baseUrl + 'projects/:project_id/tickets/:id/change-priority', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				history: $resource(baseUrl + 'projects/:project_id/tickets/:id/history', {project_id:'@project_id', id:'@id'}),
				comment: $resource(baseUrl + 'projects/:project_id/comments', {project_id:'@project_id', id:'@id'}),
				comments: $resource(baseUrl + 'projects/:project_id/comments/:id', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
			},
			sprint: {
				sprints: $resource(baseUrl + 'projects/:project_id/sprints', {project_id:'@project_id'}),
				sprint: $resource(baseUrl + 'projects/:project_id/sprints/:id', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				activate: $resource(baseUrl + 'projects/:project_id/sprints/:id/activate', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				pause: $resource(baseUrl + 'projects/:project_id/sprints/:id/pause', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				resume: $resource(baseUrl + 'projects/:project_id/sprints/:id/resume', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				lock: $resource(baseUrl + 'projects/:project_id/sprints/:id/lock', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				unlock: $resource(baseUrl + 'projects/:project_id/sprints/:id/unlock', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				close: $resource(baseUrl + 'projects/:project_id/sprints/:id/close', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}}),
				clone: $resource(baseUrl + 'projects/:project_id/sprints/:id/clone', {project_id:'@project_id', id:'@id'}),
				changePriority: $resource(baseUrl + 'projects/:project_id/sprints/change-priority', {project_id:'@project_id'}, {'put': {method: 'PUT'}}),
			},
			integrations: {
				list: $resource(baseUrl + 'integrations'),
				providers: $resource(baseUrl + 'integrations/providers'),
				projects: $resource(baseUrl + 'integrations/time_tracking/projects'),
				users: $resource(baseUrl + 'integrations/time_tracking/users'),
                activities: $resource(baseUrl + 'integrations/time_tracking/activities', {}, {'put': {method: 'PUT'}}),
                activitiesSummary: $resource(baseUrl + 'integrations/time_tracking/activities/summary'),
				refresh: $resource(baseUrl + 'integrations/time_tracking/projects/fetch', {}, {'put': {method: 'PUT'}}),
				setProject: $resource(baseUrl + 'integrations/time_tracking/projects/:time_tracking_project', {time_tracking_project:'@time_tracking_project'}, {'put': {method: 'PUT'}}),
			},
            timeTracking: {
				own: $resource(baseUrl + 'integrations/time_tracking/activities/own', {}, {'post': {method: 'POST'}, 'delete': {method: 'DELETE'}}),
                all: $resource(baseUrl + 'integrations/time_tracking/activities', {}, {'post': {method: 'POST'}, 'delete': {method: 'DELETE'}, 'put': {method: 'PUT'}}),
            },

            screens: {
                own: $resource(baseUrl + 'time-tracker/screenshots/own'), // ? project_id, date 
                all: $resource(baseUrl + 'time-tracker/screenshots'), // ? project_id, user_id, date
            },

            stories: $resource(baseUrl + 'projects/:project_id/stories', {project_id:'@project_id'} ),
            story: $resource(baseUrl + 'projects/:project_id/stories/:id', {project_id:'@project_id', id:'@id'}, {'put': {method: 'PUT'}} ),

		}
	}

})();

 /**
         * You can use this service to define your API urls. The "api" service
         * is designed to work in parallel with "apiResolver" service which you can
         * find in the "app/core/services/api-resolver.service.js" file.
         *
         * You can structure your API urls whatever the way you want to structure them.
         * You can either use very simple definitions, or you can use multi-dimensional
         * objects.
         *
         * Here's a very simple API url definition example:
         *
         *      api.getBlogList = $resource('http://api.example.com/getBlogList');
         *
         * While this is a perfectly valid $resource definition, most of the time you will
         * find yourself in a more complex situation where you want url parameters:
         *
         *      api.getBlogById = $resource('http://api.example.com/blog/:id', {id: '@id'});
         *
         * You can also define your custom methods. Custom method definitions allows you to
         * add hardcoded parameters to your API calls that you want them to be sent every
         * time you make that API call:
         *
         *      api.getBlogById = $resource('http://api.example.com/blog/:id', {id: '@id'}, {
         *         'getFromHomeCategory' : {method: 'GET', params: {blogCategory: 'home'}}
         *      });
         *
         * In addition to these definitions, you can also create multi-dimensional objects.
         * They are nothing to do with the $resource object, it's just a more convenient
         * way that we have created for you to packing your related API urls together:
         *
         *      api.blog = {
         *          list     : $resource('http://api.example.com/blog);
         *          getById  : $resource('http://api.example.com/blog/:id', {id: '@id'});
         *          getByDate: $resource('http://api.example.com/blog/:date', {id: '@date'},
         *              'get': {method: 'GET', params: {getByDate: true}}
         *          );
         *      }
         *
         * If you look at the last example from above, we overrode the 'get' method to put a
         * hardcoded parameter. Now every time we make the "getByDate" call, the {getByDate: true}
         * object will also be sent along with whatever data we are sending.
         *
         * All the above methods are using standard $resource service. You can learn more about
         * it at: https://docs.angularjs.org/api/ngResource/service/$resource
         *
         * -----
         *
         * After you defined your API urls, you can use them in Controllers, Services and even
         * in the UIRouter state definitions.
         *
         * If we use the last example from above, you can do an API call in your Controllers and
         * Services like this:
         *
         *      function MyController (api)
         *      {
         *          // Get the blog list
         *          api.blog.list.get({},
         *
         *              // Success
         *              function (response)
         *              {
         *                  console.log(response);
         *              },
         *
         *              // Error
         *              function (response)
         *              {
         *                  console.error(response);
         *              }
         *          );
         *
         *          // Get the blog with the id of 3
         *          var id = 3;
         *          api.blog.getById.get({'id': id},
         *
         *              // Success
         *              function (response)
         *              {
         *                  console.log(response);
         *              },
         *
         *              // Error
         *              function (response)
         *              {
         *                  console.error(response);
         *              }
         *          );
         *
         *          // Get the blog with the date by using custom defined method
         *          var date = 112314232132;
         *          api.blog.getByDate.get({'date': date},
         *
         *              // Success
         *              function (response)
         *              {
         *                  console.log(response);
         *              },
         *
         *              // Error
         *              function (response)
         *              {
         *                  console.error(response);
         *              }
         *          );
         *      }
         *
         * Because we are directly using $resource servive, all your API calls will return a
         * $promise object.
         *
         * --
         *
         * If you want to do the same calls in your UI Router state definitions, you need to use
         * "apiResolver" service we have prepared for you:
         *
         *      $stateProvider.state('app.blog', {
         *          url      : '/blog',
         *          views    : {
         *               'content@app': {
         *                   templateUrl: 'app/main/apps/blog/blog.html',
         *                   controller : 'BlogController as vm'
         *               }
         *          },
         *          resolve  : {
         *              Blog: function (apiResolver)
         *              {
         *                  return apiResolver.resolve('blog.list@get');
         *              }
         *          }
         *      });
         *
         *  You can even use parameters with apiResolver service:
         *
         *      $stateProvider.state('app.blog.show', {
         *          url      : '/blog/:id',
         *          views    : {
         *               'content@app': {
         *                   templateUrl: 'app/main/apps/blog/blog.html',
         *                   controller : 'BlogController as vm'
         *               }
         *          },
         *          resolve  : {
         *              Blog: function (apiResolver, $stateParams)
         *              {
         *                  return apiResolver.resolve('blog.getById@get', {'id': $stateParams.id);
         *              }
         *          }
         *      });
         *
         *  And the "Blog" object will be available in your BlogController:
         *
         *      function BlogController(Blog)
         *      {
         *          var vm = this;
         *
         *          // Data
         *          vm.blog = Blog;
         *
         *          ...
         *      }
         */
