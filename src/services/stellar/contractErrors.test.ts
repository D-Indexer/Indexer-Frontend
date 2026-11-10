// @vitest-environment node
import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import { contractErrorMessages, describeContractError, extractContractErrorCode } from './contractErrors'
import { findContractErrorCode } from './stellarService'

describe('contract errors', () => {
  it('covers every ContractError variant in Indexer-Contract src/errors.rs', () => {
    expect(Object.keys(contractErrorMessages).map(Number)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1))
  })

  it('extracts the code from a simulation error string', () => {
    const message = 'HostError: Error(Contract, #3)\n\nEvent log (newest first): ...'
    expect(extractContractErrorCode(message)).toBe(3)
    expect(extractContractErrorCode('HostError: Error(Budget, ExceededLimit)')).toBeNull()
  })

  it('maps codes to readable messages with a fallback', () => {
    expect(describeContractError(3)).toBe('That folder name is already taken. Try another one.')
    expect(describeContractError(99)).toBe('The Folder contract rejected the transaction (error #99).')
  })

  it('finds contract errors in diagnostic events of a failed transaction', () => {
    const errorVal = xdr.ScVal.scvError(xdr.ScError.sceContract(13))
    const event = new xdr.DiagnosticEvent({
      inSuccessfulContractCall: false,
      event: new xdr.ContractEvent({
        ext: new xdr.ExtensionPoint(0),
        contractId: null,
        type: xdr.ContractEventType.diagnostic(),
        body: new xdr.ContractEventBody(0, new xdr.ContractEventV0({ topics: [xdr.ScVal.scvSymbol('error'), errorVal], data: xdr.ScVal.scvVoid() })),
      }),
    })
    expect(findContractErrorCode([event])).toBe(13)
    expect(findContractErrorCode([])).toBeNull()
  })
})
