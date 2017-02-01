angular.module( 'drg.angularVerticalTree', [] )
    .directive( 'verticalTree', ["$compile", "$templateCache", "$timeout", function( $compile, $templateCache, $timeout ) {
        return {
            restrict : 'EA',
            scope : {
                items : '<treeItems',
                treeOpts : '<',
                open : '&onOpen',
                select : '&onSelect'
            },
            controller : 'vTreeCtrl',
            /**
             * To allow us to use an isolate scope and also allow user defined internal components (vertical-tree-breadcrumb and vertical-tree-leaf)
             * we need to manually replace the contents of the root element with the template after we've saved the
             * contents of each user defined component. As such, we cannot use the templateUrl property of the directive
             * lest the original contents of the root element be removed before we have a chance to access them.
             * DO NOT UNCOMMENT THE NEXT LINE
             */
            // templateUrl : 'drg/angularVerticalTree.tpl.html',
            compile : function( elem ) {

                // save the contents of each user definable component for use later
                var breadcrumb = elem.find( 'vertical-tree-breadcrumb' ),
                    leaf = elem.find( 'vertical-tree-leaf');

                breadcrumb = breadcrumb && breadcrumb.length > 0 ? breadcrumb.html() : '';
                leaf = leaf && leaf.length > 0 ? leaf.html() : '';

                // remove contents of the container for now,
                // we'll add in the template HTML later once the scope is set up
                elem.empty();

                return {
                    pre : function( scope, elem ) {
                        scope.templates = {
                            breadcrumb : 'drg/vTreeBreadcrumb' + scope.$id + '.tpl.html',
                            leaf : 'drg/vTreeLeaf' + scope.$id + '.tpl.html'
                        };

                        // save the html to be used for the breadcrumbs and leaves as templates
                        $templateCache.put( scope.templates.breadcrumb, breadcrumb );
                        $templateCache.put( scope.templates.leaf, leaf );

                        // compile the template using the isolate scope and insert it into the root element
                        elem.prepend( $compile( $templateCache.get( 'drg/angularVerticalTree.tpl.html' ) )( scope ) );
                    },
                    post : function( scope, elem ) {
                        function updateBranchHeight() {
                            $timeout( function() {
                                var breadcrumbs = document.querySelectorAll( '.v-tree-breadcrumb-container' )[0];
                                var containers = document.querySelectorAll( '.v-tree-container' )[0];
                                var branch = document.querySelectorAll( '.v-tree-branch' )[0];
                                var size = containers.offsetHeight - breadcrumbs.offsetHeight;
                                branch.style.height = 'calc(100% - ' + breadcrumbs.offsetHeight + 'px)';
                            } );
                        }
                        updateBranchHeight();
                        scope.updateBranchHeight = updateBranchHeight;
                    }
                }
            }
        };
    }] )
    .controller( 'vTreeCtrl', ["$scope", function( $scope ) {

        function deepExtend( obj, newObj ) {
            angular.forEach( newObj, function( item, key ) {
                if( angular.isObject( item ) ) {
                    if( obj[ key ] ) {
                        obj[ key ] = deepExtend( angular.isObject( obj[ key ] ) ? obj[ key ] : {}, item );
                    } else {
                        obj[ key ] = angular.copy( item );
                    }
                } else {
                    obj[ key ] = item;
                }
            } );
            return obj;
        }

        $scope.opts = deepExtend( {
            root : 'Root',
            label : 'label',
            children : 'children',
            classes : {
                container : 'panel panel-default',
                breadcrumb : 'list-group-item',
                "breadcrumb-container" : 'panel-heading list-group',
                branch : 'list-group',
                leaf : 'list-group-item'
            },
            emptyMessage : '',
            isLeaf : function() {
                return true;
            },
            isFolder : function( item ) {
                return item[ $scope.opts.children ] && item[ $scope.opts.children ].length > 0;
            }
        }, $scope.treeOpts );

        var root = {};

        if( angular.isObject( $scope.opts.root ) ) {
            root = angular.copy( $scope.opts.root );
        } else {
            root[ $scope.opts.label ] = $scope.opts.root;
        }

        Object.defineProperty( root, $scope.opts.children, {
            get : function() {
                return $scope.items;
            }
        } );

        $scope.breadcrumbs = [ root ];
        $scope.leaves = getLeaves();

        $scope.leafClickHandler = function( item ) {
            if( $scope.opts.isFolder( item ) ) {
                onOpen( item );
            } else if( $scope.opts.isLeaf( item ) ) {
                onSelect( item );
            }
        };
        $scope.breadcrumbClickHandler = function( item ) {
            for( var i = 0; i < $scope.breadcrumbs.length; i++ ) {
                if( angular.equals( $scope.breadcrumbs[ i ], item ) ) {
                    $scope.breadcrumbs.splice( i, $scope.breadcrumbs.length - i );
                    onOpen( item );
                    break;
                }
            }
        };

        function getLeaves() {
            var currentFolder = $scope.breadcrumbs[ $scope.breadcrumbs.length - 1 ];
            if( !currentFolder ) { return []; }

            var currentItems = currentFolder[ $scope.opts.children ];
            if( !currentItems ) { return []; }

            return currentItems.filter( $scope.opts.isLeaf );
        }

        function onOpen( folder ) {
            $scope.breadcrumbs.push( folder );
            $scope.leaves = getLeaves();

            $scope.updateBranchHeight();

            $scope.$emit( 'verticalTree.openFolder', folder );

            if( $scope.open ) {
                $scope.open( { folder : folder } );
            }
        }

        function onSelect( item ) {
            $scope.$emit( 'verticalTree.selectItem', item );

            if( $scope.select ) {
                $scope.select( { item : item } );
            }
        }

    }] );

angular.module("drg.angularVerticalTree").run(["$templateCache", function($templateCache) {$templateCache.put("drg/angularVerticalTree.tpl.html","<!-- .panel by default -->\r\n<div class=\"v-tree-container\" ng-class=\"opts.classes.container\" >\r\n\r\n    <!-- .panel-heading by default -->\r\n    <div class=\"v-tree-breadcrumb-container\" ng-class=\"opts.classes.breadcrumb-container\">\r\n        <a class=\"v-tree-breadcrumb\"\r\n           href=\"javascript:;\"\r\n           ng-class=\"opts.classes.breadcrumb\"\r\n           ng-click=\"breadcrumbClickHandler(breadcrumb)\"\r\n           ng-include=\"templates.breadcrumb\"\r\n           ng-repeat=\"breadcrumb in breadcrumbs\"\r\n           style=\"display: block;\">\r\n        </a>\r\n    </div>\r\n\r\n    <!-- .list-group by default -->\r\n    <div class=\"v-tree-branch\" ng-class=\"opts.classes.branch\">\r\n        <!-- .list-group-item by default -->\r\n        <a class=\"v-tree-leaf\"\r\n           href=\"javascript:;\"\r\n           ng-class=\"opts.classes.leaf\"\r\n           ng-click=\"leafClickHandler(leaf)\"\r\n           ng-include=\"templates.leaf\"\r\n           ng-repeat=\"leaf in leaves\">\r\n        </a>\r\n        <p class=\"v-tree-empty\" ng-if=\"!leaves || !leaves.length\" ng-bind=\"opts.emptyMessage\"></p>\r\n    </div>\r\n\r\n</div>\r\n");}]);