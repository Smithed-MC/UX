/** Declaration file generated by dts-gen */

declare module 'abstract-cache' {

    declare function abstract_cache(options: {useAwait?: boolean, client?: any, driver?: {name?: string, options?: any}}): any;
    
    declare namespace abstract_cache {
        function memclient(config: any): any;
        
    }

    export = abstract_cache;
}
