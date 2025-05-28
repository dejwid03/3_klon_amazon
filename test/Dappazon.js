const { expect } = require("chai")

// Funkcja pomocnicza do konwersji liczby na wei (ether)
const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

// Stałe globalne do wystawienia przedmiotu...
const ID = 1
const NAME = "Shoes"
const CATEGORY = "Clothing"
const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
const COST = tokens(1)
const RATING = 4
const STOCK = 5

describe("Dappazon", () => {
  let dappazon
  let deployer, buyer

  beforeEach(async () => {
    // Ustaw konta testowe
    [deployer, buyer] = await ethers.getSigners()

    // Wdróż kontrakt
    const Dappazon = await ethers.getContractFactory("Dappazon")
    dappazon = await Dappazon.deploy()
  })

  describe("Deployment", () => {
    it("Sets the owner", async () => {
      // Sprawdza czy właściciel kontraktu jest poprawnie ustawiony
      expect(await dappazon.owner()).to.equal(deployer.address)
    })
  })

  describe("Listing", () => {
    let transaction

    beforeEach(async () => {
      // Wystaw przedmiot na sprzedaż
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()
    })

    it("Returns item attributes", async () => {
      // Sprawdza czy atrybuty przedmiotu są poprawnie zapisane
      const item = await dappazon.items(ID)

      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST)
      expect(item.rating).to.equal(RATING)
      expect(item.stock).to.equal(STOCK)
    })

    it("Emits List event", () => {
      // Sprawdza czy został wyemitowany event List
      expect(transaction).to.emit(dappazon, "List")
    })
  })

  describe("Buying", () => {
    let transaction

    beforeEach(async () => {
      // Wystaw przedmiot na sprzedaż
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Kup przedmiot
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()
    })


    it("Updates buyer's order count", async () => {
      // Sprawdza czy liczba zamówień kupującego została zaktualizowana
      const result = await dappazon.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    it("Adds the order", async () => {
      // Sprawdza czy zamówienie zostało dodane do historii kupującego
      const order = await dappazon.orders(buyer.address, 1)

      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })

    it("Updates the contract balance", async () => {
      // Sprawdza czy saldo kontraktu zostało zaktualizowane po zakupie
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(COST)
    })

    it("Emits Buy event", () => {
      // Sprawdza czy został wyemitowany event Buy
      expect(transaction).to.emit(dappazon, "Buy")
    })
  })

  describe("Withdrawing", () => {
    let balanceBefore

    beforeEach(async () => {
      // Wystaw przedmiot na sprzedaż
      let transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Kup przedmiot
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()

      // Pobierz saldo deployera przed wypłatą
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Wypłać środki z kontraktu
      transaction = await dappazon.connect(deployer).withdraw()
      await transaction.wait()
    })

    it('Updates the owner balance', async () => {
      // Sprawdza czy saldo właściciela zostało zaktualizowane po wypłacie
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async () => {
      // Sprawdza czy saldo kontraktu wynosi 0 po wypłacie
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(0)
    })
  })
})