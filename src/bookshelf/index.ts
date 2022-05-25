'use strict';

import { assign, identity } from 'lodash';
import { pluralize as plural } from 'inflection';
import { SerialOpts, Serializer } from 'jsonapi-serializer';
import { Mapper, MapOpts } from '../interfaces';
import { Data, BookOpts } from './extras';
import { LinkOpts } from '../links';

import { Information, processData, toJSON } from './utils';

/**
 * Mapper class for Bookshelf sources
 */
export default class Bookshelf implements Mapper {

  /**
   * Standard constructor
   */
  constructor(public baseUrl: string, public serialOpts?: SerialOpts) { }

  /**
   * Maps bookshelf data to a JSON-API 1.0 compliant object
   *
   * The `any` type data source is set for typing compatibility, but must be removed if possible
   * TODO fix data any type
   */
  map(data: Data | any, type: string, mapOpts: MapOpts = {}): any {

    // Set default values for the options
    const {
      omitAttrs,
      keyForAttr = identity,
      relations = true,
      virtuals = false,
      typeForModel = (attr: string) => plural(attr),
      enableLinks = true,
      pagination,
      query,
      extras
    }: MapOpts = mapOpts;

    const bookOpts: BookOpts = {
      omitAttrs, keyForAttr, virtuals,
      relations, typeForModel,
      enableLinks, pagination, query, extras
    };

    const linkOpts: LinkOpts = { baseUrl: this.baseUrl, type, pag: pagination };

    const info: Information = { bookOpts, linkOpts };
    const template: SerialOpts = processData(info, data);

    const typeForAttribute: (attr: string) => string =
      typeof typeForModel === 'function'
        ? typeForModel
        : (attr: string) =>  typeForModel[attr] || plural(attr);  // pluralize when falsy

    // Override the template with the provided serializer options
    assign(template, { meta: mapOpts.meta, typeForAttribute, keyForAttribute: keyForAttr }, this.serialOpts);

    // Return the data in JSON API format
    const json: any = toJSON(data, bookOpts);
    return new Serializer(type, template).serialize(json);
  }
}
