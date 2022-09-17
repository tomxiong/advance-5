import React, { useEffect, useState } from 'react'
import { Form, Grid } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'

import { TxButton } from './substrate-lib/components'

import KittyCards from './KittyCards'

function Main (props) {  
  const [kittyIndexes, setKittyIndexes] = useState([])
  const [kitties, setKitties] = useState([]);

  const [status, setStatus] = useState('')

  const { api, keyring, currentAccount } = useSubstrateState()

  useEffect(() => {
    const fetchIndexes = async () => {
      const kittyIndex = parseInt(
        await api.query.kittyModule.nextKittyId(), 10
      )  
      //console.log('kitties count: ', kittyIndex)
      //console.log('kitties count: ', parseInt(kittyIndex, 10))
      if (kittyIndex <= 0) {
        return;
      }
      setKittyIndexes(Array.from(Array(kittyIndex).keys()));
    };

    fetchIndexes();
  }, [api, status, keyring, setKittyIndexes]);

  useEffect(() => {
    let unsub = null;

    const fetchKitties = async () => {
      const owners = await api.query.kittyModule.kittyOwner.multi(
        kittyIndexes
      );
      const kittyDNAs = await api.query.kittyModule.kitties.multi(
        kittyIndexes
      );
      const kitties = kittyIndexes.map(kittyIndex => ({
        id: kittyIndex,
        dna: kittyDNAs[kittyIndex].value,
        owner: owners[kittyIndex].value.toJSON(),
      }));
      setKitties(kitties);
    };

    fetchKitties();

    return () => {
      unsub && unsub();
    };
  }, [api, keyring, kittyIndexes, setKitties]);

  return <Grid.Column width={16}>
    <h1>小毛孩</h1>
    <KittyCards kitties={kitties} accountPair={currentAccount} setStatus={setStatus} />
    <Form style={{ margin: '1em 0' }}>
      <Form.Field style={{ textAlign: 'center' }}>
        <TxButton
          accountPair={currentAccount}
          label="创建"
          type='SIGNED-TX'
          setStatus={setStatus}
          attrs={{
            palletRpc: 'kittyModule',
            callable: 'create',
            inputParams: [],
            paramFields: []
          }}
        />
      </Form.Field>
    </Form>
    <div style={{ overflowWrap: 'break-word' }}>{status}</div>
  </Grid.Column>

}

export default function KittiesModule(props) {
  const { api } = useSubstrateState()
  return api.query.kittyModule? (
    <Main {...props} />
  ) : null
}