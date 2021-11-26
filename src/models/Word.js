import mongoose from 'mongoose';
import { every, has, partial } from 'lodash';
import { toJSONPlugin, toObjectPlugin, updatedOnHook } from './plugins';
import Dialects from '../shared/constants/Dialects';
import wordClass from '../shared/constants/wordClass';

const REQUIRED_DIALECT_KEYS = ['word', 'variations', 'dialect', 'pronunciation'];
const REQUIRED_DIALECT_CONSTANT_KEYS = ['code', 'value', 'label'];

const { Schema } = mongoose;
const wordSchema = new Schema({
  word: { type: String, required: true },
  wordClass: {
    type: String,
    default: wordClass.NNC.value,
    enum: Object.values(wordClass).map(({ value }) => value),
  },
  definitions: { type: [{ type: String }], default: [] },
  dialects: {
    type: Object,
    validate: (v) => {
      const dialectValues = Object.values(v);
      return dialectValues.every((dialectValue) => (
        every(REQUIRED_DIALECT_KEYS, partial(has, dialectValue))
        && every(REQUIRED_DIALECT_CONSTANT_KEYS, partial(has, Dialects[dialectValue.dialect]))
        && dialectValue.dialect === Dialects[dialectValue.dialect].value
      ));
    },
  },
  pronunciation: { type: String, default: '' },
  isStandardIgbo: { type: Boolean, default: false },
  variations: { type: [{ type: String }], default: [] },
  frequency: { type: Number },
  stems: { type: [{ type: String }], default: [] },
  updatedOn: { type: Date, default: Date.now() },
}, { toObject: toObjectPlugin });

/* Create text indexes for each dialect word field */
const dialectsIndexFields = Object.keys(Dialects)
  .reduce((indexFields, key) => (
    { ...indexFields, [`dialects.${key}.word`]: 'text' }
  ), {});

wordSchema.index({ word: 'text', variations: 'text', ...dialectsIndexFields });

toJSONPlugin(wordSchema);
updatedOnHook(wordSchema);

const WordModel = mongoose.model('Word', wordSchema);
WordModel.syncIndexes();

export default WordModel;
