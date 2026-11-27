import assert from 'node:assert/strict'
import test from 'node:test'
import {emptyReport, nextIndex, normalizeReport, parseConfig} from '../src/utils/reports.js'
import {serialize} from '../src/services/storage.js'

const report = {...emptyReport, name: ' Ventas ', url: 'https://app.powerbi.com/reportEmbed?reportId=example'}

test('preserva el orden y el estado al exportar e importar', () => {
  const items = [{...normalizeReport(report), id: 'first'}, {...normalizeReport({...report, active: false}), id: 'second'}]
  assert.deepEqual(parseConfig(serialize(items)), items)
  assert.equal(items[0].name, 'Ventas')
})

test('rechaza publicación pública, credenciales y protocolos inseguros', () => {
  for (const url of ['https://app.powerbi.com/view?r=example', 'https://user:pass@example.com', 'javascript:alert(1)', 'https://example.com/?access_token=example']) {
    assert.throws(() => normalizeReport({...report, type: 'web', url}))
  }
})

test('rechaza duplicados y valores de tiempo inválidos', () => {
  assert.throws(() => normalizeReport({...report, seconds: 0}))
  assert.throws(() => normalizeReport({...report, refresh: -1}))
  const stored = {...report, id: 'duplicate'}
  assert.throws(() => parseConfig(serialize([stored, stored])))
})

test('la secuencia continúa en ambos extremos', () => {
  assert.equal(nextIndex(2, 3), 0)
  assert.equal(nextIndex(0, 3, -1), 2)
})
