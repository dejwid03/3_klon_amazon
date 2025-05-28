import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

// Components
import Navigation from './components/Navigation'
import Section from './components/Section'
import Product from './components/Product'

// ABIs
import Dappazon from './abis/Dappazon.json'

// Config
import config from './config.json'

function App() {
  // Stan do przechowywania providera blockchain
  const [provider, setProvider] = useState(null)
  // Stan do przechowywania instancji kontraktu Dappazon
  const [dappazon, setDappazon] = useState(null)

  // Stan do przechowywania adresu konta użytkownika
  const [account, setAccount] = useState(null)

  // Stany do przechowywania listy przedmiotów z podziałem na kategorie
  const [electronics, setElectronics] = useState(null)
  const [clothing, setClothing] = useState(null)
  const [toys, setToys] = useState(null)

  // Stan do przechowywania wybranego przedmiotu i popupu
  const [item, setItem] = useState({})
  const [toggle, setToggle] = useState(false)

  // Funkcja do otwierania/zamykania popupu z detalami produktu
  const togglePop = (item) => {
    setItem(item)
    toggle ? setToggle(false) : setToggle(true)
  }

  // Funkcja ładująca dane z blockchaina
  const loadBlockchainData = async () => {
    // Połącz z portfelem użytkownika przez MetaMask
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
    // Pobierz sieć (np. chainId)
    const network = await provider.getNetwork()

    // Utwórz instancję kontraktu Dappazon
    const dappazon = new ethers.Contract(config[network.chainId].dappazon.address, Dappazon, provider)
    setDappazon(dappazon)

    const items = []

    // Pobierz 9 przedmiotów z kontraktu (ID od 1 do 9)
    for (var i = 0; i < 9; i++) {
      const item = await dappazon.items(i + 1)
      items.push(item)
    }
    
    // Podziel przedmioty na kategorie
    const electronics = items.filter((item) => item.category === 'electronics')
    const clothing = items.filter((item) => item.category === 'clothing')
    const toys = items.filter((item) => item.category === 'toys')

    // Zapisz przedmioty w stanie
    setElectronics(electronics)
    setClothing(clothing)
    setToys(toys)
  }

  // Załaduj dane z blockchaina po załadowaniu komponentu
  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      {/* Pasek nawigacyjny z przekazanym kontem */}
      <Navigation account={account} setAccount={setAccount} />

      <h2>Dappazon Best Sellers</h2>

      {/* Wyświetl sekcje z przedmiotami, jeśli są załadowane */}
      {electronics && clothing && toys && (
        <>
          <Section title={"Clothing & Jewelry"} items={clothing} togglePop={togglePop} />
          <Section title={"Electronics & Gadgets"} items={electronics} togglePop={togglePop} />
          <Section title={"Toys & Gaming"} items={toys} togglePop={togglePop} />
        </>
      )}

      {/* Wyświetl popup z detalami produktu jeśli toggle jest true */}
      {toggle && (
        <Product item={item} provider={provider} account={account} dappazon={dappazon} togglePop={togglePop} />
      )}
    </div>
  );
}

export default App;