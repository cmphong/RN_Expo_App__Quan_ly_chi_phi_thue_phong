
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage';

// firebase
import {fb} from './AppLoading'

// my Component
import HomeDrawer from './navigation/HomeDrawer';
import InitialData from './screen/InitialData/initialData';
import { getDocUID } from './Features/myGetter'
import ActivityIndicatorElement from './components/loadingSpinner'

// Redux Toolkit
import store from './redux/store/store';
import { indexInitSlice } from './redux/reducer/sliceIndexInit'
import { unitPriceSlice } from './redux/reducer/sliceUnitPrice'
import { receiptSlice } from './redux/reducer/sliceReceipt'
import { chartSlice } from './redux/reducer/sliceChart'


const consoleLog = n => console.log('===== App.js -- line: ' + n + ' ==============')


function App(props) {
  
  const [loading, setLoading] = useState(true)

  const [showHome, setShowHome] = useState(true)
  const [user, setUser] = useState()

  function submit(index, unitPrice) {

    store.dispatch(indexInitSlice.actions.initIndex(index))
    addItemToAsyncStorage('indexInit', index)
    store.dispatch(unitPriceSlice.actions.initUnitPrice(unitPrice))
    addItemToAsyncStorage('unitPrice', unitPrice)

    setShowHome(true)
  }

  const addItemToAsyncStorage = async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem(key, jsonValue)
    } catch (e) {
      // saving error
    }
  }

  async function fetchThenRender(data){
    // data.data()
    const receipt = data.data().receipt
    const indexInit = data.data().indexInit
    const unitPrice = data.data().unitPrice
    
    store.dispatch(indexInitSlice.actions.initIndex(indexInit))
    store.dispatch(unitPriceSlice.actions.initUnitPrice(unitPrice))
    store.dispatch(receiptSlice.actions.initReceipt(receipt))
    
    await AsyncStorage.setItem('receipt', JSON.stringify(data.data().receipt))
    await AsyncStorage.setItem('indexInit', JSON.stringify(data.data().indexInit))
    await AsyncStorage.setItem('unitPrice', JSON.stringify(data.data().unitPrice))
    await AsyncStorage.setItem('chart', JSON.stringify(data.data().chart))
    
    setLoading(false)
    setShowHome(true)
  }

  const clearRedux = () => {
    store.dispatch(indexInitSlice.actions.clear());
    store.dispatch(unitPriceSlice.actions.clear());
    store.dispatch(receiptSlice.actions.clear());
    store.dispatch(chartSlice.actions.clear());
  }

  useEffect(() => {

    const uid = fb.auth().currentUser.uid
    try{
      AsyncStorage.getItem('uid') // Promise - Check uid EXIST in AsyncStorage
        .then(uid_AsyncStorage => {
        // PH???N 1 ==============================================================================
          if(uid_AsyncStorage == null){ // uid NOT EXIST ==> OK
            console.log('uid_AsyncStorage r???ng')
            consoleLog(93)
            AsyncStorage.setItem('uid', uid) // Promise - set uid
            
            getDocUID(uid) // Promise
              .then(field => { // field.data() to get value
                // if(field.data() == undefined){
                if(field == undefined){
                  setLoading(false)
                  setShowHome(false)
                }
                else{
                  setLoading(true)
                  fetchThenRender(field)
                }
              })
          }

        // PH???N 2 ================================================================================
          else { // uid EXIST ==> OK => Tr??ng / Kh??ng tr??ng

            // CHECK currentUser.uid === uid_AsyncStorage
            if(uid == uid_AsyncStorage){ // TRUE - Tr??ng UID
              console.log('Tr??ng UID')
              // Ng?????i d??ng ch??a kh???i t???o  --   Ng?????i d??ng ???? kh???i t???o
              const keys = AsyncStorage.getAllKeys().then(keys => {
                return keys.filter(item => !item.includes('firebase') && !item.includes('uid'))
              })
              keys.then(arr_key => { 
                if(arr_key.length != 0){ // Ng?????i d??ng ???? kh???i t???o (vd: thong20)
                  arr_key.forEach(item => {
                    
                    // HANDLE REDUX ==============================================
                    if(item === 'receipt'){
                      AsyncStorage.getItem("receipt").then(json_Value => {
                        store.dispatch(receiptSlice.actions.initReceipt(JSON.parse(json_Value)))
                      })
                    }
                    if(item === 'unitPrice'){
                      AsyncStorage.getItem("unitPrice").then(json_Value => {
                        store.dispatch(unitPriceSlice.actions.initUnitPrice(JSON.parse(json_Value)))
                      })
                    }
                    if(item === 'indexInit'){
                      AsyncStorage.getItem("indexInit").then(json_Value => {
                        store.dispatch(indexInitSlice.actions.initIndex(JSON.parse(json_Value)))
                      })
                    }
                    // END HANDLE REDUX ==============================================
                  })
                  setLoading(false)
                  setShowHome(true)
                }else{ // Ng?????i d??ng ch??a kh???i t???o (vd: demo)
                  setLoading(false)
                  setShowHome(false)
                }
              }) 
            }else{ // FALSE - Kh??ng tr??ng UID => OK
              console.log('Kh??ng tr??ng UID')

              AsyncStorage.setItem('uid', uid) // set uid again
              
              const keys = AsyncStorage.getAllKeys().then(keys => {
                return keys.filter(item => !item.includes('firebase') && !item.includes('uid'))
              })
              keys.then(key => { 
                if(key.length != 0){ // clear AsyncStorage
                  AsyncStorage.multiRemove(["receipt", "unitPrice", "indexInit", "chart"])
                }else{ // kh??ng c?? d??? li???u (Ng?????i m???i ch??? Kh???i t???o index)
                  setLoading(false)
                  setShowHome(true)
                }
              }) 
              
              // clear Redux
              clearRedux();
              
              // Fetch
              getDocUID(uid).then(field => { // field.data() to get value
                if(field == undefined){ // length: 0
                  setShowHome(false)
                }else{  // field lenght != 0 => fetch OK
                  setLoading(true)
                  fetchThenRender(field)
                }
              })

            }
          }
        })
      }catch(e){
        console.log(e)
        consoleLog(194)
      }  
      
  }, [showHome])

  if(loading){
    return <ActivityIndicatorElement />
  }else {
    if(showHome){
      return (
        <NavigationContainer>
          <HomeDrawer />
        </NavigationContainer>
      )
    }else{
      return <InitialData fromInitialData={submit} />
    }
  }

}

export default App