'use strict';

var app = angular.module('app', ['ngRoute', 'toaster','appControllers', 'appServices', 'appDirectives', 'ngFileUpload'])

var appServices = angular.module('appServices', []);
var appControllers = angular.module('appControllers', []);
var appDirectives = angular.module('appDirectives', []);

app.config(['$locationProvider', '$routeProvider', 
  function($location, $routeProvider) {
      $routeProvider.
        when('/register', {
            templateUrl: 'partials/register.html',
            controller: 'UserCtrl'
        }).
        when('/user/add', {
            templateUrl: 'partials/user.create.html',
            controller: 'UserAddCtrl',
            access: { requiredAuthentication: false }
        }).
        when('/login', {
            templateUrl: 'partials/signin.html',
            controller: 'UserCtrl'
        }).
        when('/dashboard', {
            templateUrl: 'partials/user.list.html',
            controller: 'UserListCtrl',
            activetab: 'list'
        }).
        when('/user/:id', {
            templateUrl: 'partials/user.edit.html',
            controller: 'UserEditCtrl'
        }).
        when('/logout', {
            templateUrl: 'partials/logout.html',
            controller: 'UserCtrl',
            activetab: 'logout',
            access: { requiredAuthentication: false }
        }).
        when('/forgot-password', {
            templateUrl: 'partials/forgot-password.html',
            controller: 'UserCtrl',
        }).
        otherwise({
            redirectTo: '/login'
        });
}]);


app.config(function ($httpProvider) {    
    $httpProvider.interceptors.push('TokenInterceptor');
});

app.run(function($rootScope, $location, $window, AuthenticationService) {
    $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
       
        if (nextRoute != null && (nextRoute.originalPath === "/register" || nextRoute.originalPath === "/login") && $window.sessionStorage.auth && $window.sessionStorage.auth== 'false'){
            $location.path("/");
        }

        if (nextRoute != null &&nextRoute.originalPath === "/user/add" && $window.sessionStorage.auth && $window.sessionStorage.auth== 'false'){
            if (currentRoute != null){
                $location.path(currentRoute.originalPath);
            } else{
                $location.path("/login");
            }
        } else {
            //redirect only if both isAuthenticated is false and no token is set
            if (nextRoute != null && nextRoute.access != null && nextRoute.access.requiredAuthentication 
                && !AuthenticationService.isAuthenticated && !$window.sessionStorage.token) {
                    $location.path("/login");
                    toaster.pop({
                        type: 'error',
                        body: 'Unauthorised Request',
                        timeout: 6000
                    });
            } 
        }
        
        
    });
});

appControllers.controller('mainCtrl', ['$scope', '$rootScope',
    function MainCtrl($scope, $rootScope) {

    }
]);

appControllers.controller('UserListCtrl', ['$scope', '$rootScope', '$route', '$sce', '$window', '$location', 'toaster', 'UserService',
    function UserListCtrl($scope, $rootScope, $route, $sce, $window, $location, toaster, UserService) {
        $rootScope.showLogout = false;
        $rootScope.showCreate = false;
        $scope.date=new Date();

        $scope.editUser = function (userId) {           
            $location.path('/user/' + userId);
        };

        $scope.createNewUser = function () {
            $location.path('/user/add');
        };

        $scope.deleteUser = function (userId) {
            var deleteUser = $window.confirm('Are you absolutely sure you want to delete?');

            if (deleteUser) {       
                UserService.remove(userId).success(function (data) {      
                    $location.path("/dashboard");
                    UserService.findAll().success(function(data) {
                        toaster.pop({
                            type: 'success',
                            body: "User Deleted Successfully"
                        });
                        
                        $scope.users= data;
                    }).error(function(data, status) {
                        toaster.pop({
                            type: 'error',
                            body: data.message || data,
                            timeout: 6000
                        });
                    });           
                }).error(function(data, status) {
                    toaster.pop({
                        type: 'error',
                        body: data.message || data,
                        timeout: 6000
                    });
                    console.log(status);
                    console.log(data);
                });
            }
        };

        if (!$window.sessionStorage.auth && $window.sessionStorage.auth== 'true' && !$window.sessionStorage.token){
            $location.path("/login");
        }else{
            $rootScope.$route = $route;
            $scope.users = [];
            if ($window.sessionStorage.auth && $window.sessionStorage.auth== 'true'){
                $rootScope.showCreate = true;
            }

            if ($window.sessionStorage.token){
                $rootScope.showLogout = true;
            }

            UserService.findAll().success(function(data) {
                console.log(data);
                
                $scope.users= data;
            }).error(function(data, status) {
                toaster.pop({
                    type: 'error',
                    body: data.message || data,
                    timeout: 6000
                });
            });
        }
    }
]);

appControllers.controller('UserEditCtrl', ['$scope', '$routeParams', '$rootScope', '$location', '$sce', '$window', 'toaster','UserService',
    function UserEditCtrl($scope, $routeParams, $rootScope, $location, $sce, $window, toaster, UserService) {
        $rootScope.showLogout = false;
        $rootScope.showCreate = false;

        $scope.updateUser = function () {
            UserService.update($scope.user).success(function (data) {      
                $location.path("/dashboard");
                toaster.pop({
                    type: 'success',
                    body: "User Updated Successfully"
                });
            }).error(function(data, status) {
                toaster.pop({
                    type: 'error',
                    body: data.message || data,
                    timeout: 6000
                })
            });
        };

        $scope.cancel = function () {
            $location.path('/dashboard');
        };
      
        $scope.user = {}

        var id = $routeParams.id;

        if ($window.sessionStorage.token){
            $rootScope.showLogout = true;
        }

        UserService.read(id).success(function(data) {
            $scope.user = data;
            $scope.user_roles = ['user','admin'];

        }).error(function(data, status) {
            toaster.pop({
                type: 'error',
                body: data.message || data,
                timeout: 6000
            })
        });
    }
]);

appControllers.controller('UserAddCtrl', ['$scope', '$rootScope', '$route', '$location' , '$window',  'toaster', 'UserService',
    function UserAddCtrl($scope, $rootScope, $route, $location , $window,  toaster, UserService) {
        $rootScope.showLogout = false;
        $rootScope.showCreate = false;

        $rootScope.$route = $route;
        
        if ($window.sessionStorage.token){
            $rootScope.showLogout = true;
        }
        if (!$window.sessionStorage.auth) {
            $location.path("/dashboard");
        } else{
            $scope.user = {}
            $scope.addUser = function save(user) {
                if(user != undefined && user.password != user.passwordConfirmation){
                    toaster.pop({
                        type: 'error',
                        body: "Passwords does not match",
                        timeout: 6000
                    });
                } else if (user != undefined && user.fullName != undefined && user.emailId != undefined && user.address != undefined && user.password != undefined && user.passwordConfirmation!= undefined) {
                    UserService.addUser(user).success(function(data) {
                        $location.path("/dashboard");
                        toaster.pop({
                            type: 'success',
                            body: "User successfully added"
                        });
                    }).error(function(data, status) {
                        toaster.pop({
                            type: 'error',
                            body: data.message || data,
                            timeout: 6000
                        });
                    });
                } else{
                    toaster.pop({
                        type: 'error',
                        body: "Please fill required(*) fields",
                        timeout: 6000
                    });
                }
            }
        }
    }
]);

appControllers.controller('UserCtrl', ['$scope', '$rootScope', '$location', '$window',  'toaster', 'UserService', 'AuthenticationService',  
    function UserCtrl($scope, $rootScope, $location, $window,  toaster, UserService, AuthenticationService) {
        $rootScope.showLogout = false;
        $rootScope.showCreate = false;

        if ($window.sessionStorage.auth){
            $rootScope.showCreate = true
        }
        
        if ($window.sessionStorage.token){
            $rootScope.showLogout = true;
        }
        
        $scope.signIn = function signIn(username, password) {

            if (username != null && password != null) {
                
                UserService.signIn(username, password).success(function(data) {
                    AuthenticationService.isAuthenticated = true;
                    $window.sessionStorage.token = data.token;
                    $rootScope.showLogout = true;
                    $window.sessionStorage.setItem("auth", data.auth);
                    $location.path("/dashboard");
                    toaster.pop({
                        type: 'success',
                        body: "Successfully logged in!"
                    });
                }).error(function(data, status) {
                    toaster.pop({
                        type: 'error',
                        body: data.message || data,
                        timeout: 6000
                    });
                });
            }
        }

        $scope.forgotPassword = function forgotPassword(emailId) {

            if (emailId != null) {
                
                UserService.forgotPassword(emailId).success(function(data) {
                    $location.path("/login");
                    toaster.pop({
                        type: 'success',
                        body: "Password is generated and sent via mail!"
                    });
                }).error(function(data, status) {
                    toaster.pop({
                        type: 'error',
                        body: data.message || data,
                        timeout: 6000
                    });
                });
            } else {
                toaster.pop({
                    type: 'error',
                    body: "Please enter your email",
                    timeout: 6000
                });
            }
        }

        $scope.logOut = function logOut() {
            if (AuthenticationService.isAuthenticated) { 
                AuthenticationService.isAuthenticated = false;
                delete $window.sessionStorage.token;
                delete $window.sessionStorage.auth;
                $rootScope.showLogout = false;
                $rootScope.showCreate = false;
                $location.path("/login");
                toaster.pop({
                    type: 'success',
                    body: "Successfully logged Out!"
                });
            }
            else {
                $location.path("/login");
            }
        }

        $scope.register = function register(user) {
            if (AuthenticationService.isAuthenticated) {
                $location.path("/dashboard");
            }
            else {
                if(user != undefined && user.password != user.passwordConfirmation){
                    toaster.pop({
                        type: 'error',
                        body: "Passwords does not match",
                        timeout: 6000
                    });
                } else if (user != undefined && user.fullName != undefined && user.emailId != undefined && user.address != undefined && user.password != undefined && user.passwordConfirmation!= undefined) {
                    UserService.register(user).success(function (data) {      
                        $location.path("/login");
                        toaster.pop({
                            type: 'success',
                            body: "Successfully Registered!"
                        });
                    }).error(function(data, status) {
                        toaster.pop({
                            type: 'error',
                            body: data.message || data,
                            timeout: 6000
                        });
                        console.log(status);
                        console.log(data);
                    });
                } else{
                    toaster.pop({
                        type: 'error',
                        body: "Please fill required(*) fields",
                        timeout: 6000
                    });
                }
            }
        }
    }
]);

appDirectives.directive('displayMessage', function() {
	return {
		restrict: 'E',
		scope: {
        	messageType: '=type',
        	message: '=data'
      	},
		template: '<div class="alert {{messageType}}">{{message}}</div>',
		link: function (scope, element, attributes) {
            scope.$watch(attributes, function (value) {
                element[0].children.hide(); 
            });
        }
	}
});

appServices.factory('AuthenticationService', function() {
    var auth = {
        isAuthenticated: false,
        isAdmin: false
    }

    return auth;
});

appServices.factory('TokenInterceptor', function ($q, $window, $location, AuthenticationService) {
    return {
        request: function (config) {
            
            config.headers = config.headers || {};
            if ($window.sessionStorage.token) {
                config.headers.Authorization = 'bearer ' + $window.sessionStorage.token;
            }
            return config;
        },

        requestError: function(rejection) {
            return $q.reject(rejection);
        },

        /* Set Authentication.isAuthenticated to true if 200 received */
        response: function (response) {
            if (response != null && response.status == 200 && $window.sessionStorage.token && !AuthenticationService.isAuthenticated) {
                AuthenticationService.isAuthenticated = true;
            }
            return response || $q.when(response);
        },

        /* Revoke client authentication if 401 is received */
        responseError: function(rejection) {
            if (rejection != null && rejection.status === 401 && ($window.sessionStorage.token || AuthenticationService.isAuthenticated)) {
                $location.path("/dashboard");
            }

            return $q.reject(rejection);
        }
    };
});

appServices.factory('UserService', function($http) {
    return {
        read: function(id) {
            return $http.get('/api/user/?id=' + id);
        },

        update: function(user) {
            return $http.put('/api/user', user);
        },

        remove: function(id) {
            return $http.delete('/api/user/?id=' + id);
        },

        forgotPassword: function(email) {
            return $http.post('/api/user/password', {email: email});
        },
        
        findAll: function() {
            return $http.get('/api/users');
        },

        addUser: function(user) {
            return $http.post('/api/user', {name:user.fullName, email_id: user.emailId, password: user.password, password_confirmation: user.passwordConfirmation, address:user.address });
        },

        signIn: function(username, password) {
            return $http.post('/api/login', {username: username, password: password});
        },

        logOut: function() {
            return $http.get('/api/logout');
        },

        register: function(user) {
            return $http.post('/api/register', {name:user.fullName, email_id: user.emailId, password: user.password, password_confirmation: user.passwordConfirmation, address:user.address });
        }
    }
});