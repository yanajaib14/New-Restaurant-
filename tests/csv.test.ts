import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,csvRecords} from '../src/lib/csv.ts';
test('quoted commas, multiline cells, doubled quotes, BOM and CRLF survive',()=>{
 assert.deepEqual(csvRecords('\ufeffname,notes\r\n"Fixture, one","line 1\r\nline ""two"""\r\n'),[{name:'Fixture, one',notes:'line 1\r\nline "two"'}]);
});
test('empty lines do not become business records',()=>assert.deepEqual(parseCSV('name,q\n\nFixture,0\n'),[['name','q'],['Fixture','0']]));
test('malformed quote fails instead of silently changing fields',()=>{assert.throws(()=>parseCSV('a,"unfinished'));assert.throws(()=>parseCSV('"closed"tail,b'));});
test('duplicate headers and mismatched widths fail before any writes',()=>{assert.throws(()=>csvRecords('name,name\na,b'));assert.throws(()=>csvRecords('name,q\na,b,c'));});
