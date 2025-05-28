// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Dappazon {
    address public owner; // Adres właściciela kontraktu

    // Struktura opisująca przedmiot
    struct Item {
        uint256 id;         // ID przedmiotu
        string name;        // Nazwa przedmiotu
        string category;    // Kategoria przedmiotu
        string image;       // Link do obrazka przedmiotu
        uint256 cost;       // Cena przedmiotu
        uint256 rating;     // Ocena przedmiotu
        uint256 stock;      // Ilość dostępnych sztuk
    }

    // Struktura opisująca zamówienie
    struct Order {
        uint256 time;       // Czas złożenia zamówienia (timestamp)
        Item item;          // Zamówiony przedmiot
    }

    // Mapping przechowujący przedmioty po ID
    mapping(uint256 => Item) public items;
    // Mapping przechowujący zamówienia użytkowników: adres => (id zamówienia => zamówienie)
    mapping(address => mapping(uint256 => Order)) public orders;
    // Mapping przechowujący liczbę zamówień dla danego użytkownika
    mapping(address => uint256) public orderCount;

    // Event wywoływany przy zakupie przedmiotu
    event Buy(address buyer, uint256 orderId, uint256 itemId);
    // Event wywoływany przy wystawieniu przedmiotu
    event List(string name, uint256 cost, uint256 quantity);

    // Modyfikator pozwalający tylko właścicielowi wykonywać daną funkcję
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    // Konstruktor ustawiający właściciela kontraktu
    constructor() {
        owner = msg.sender;
    }

    // Funkcja do wystawiania nowego przedmiotu na sprzedaż
    function list(
        uint256 _id,
        string memory _name,
        string memory _category,
        string memory _image,
        uint256 _cost,
        uint256 _rating,
        uint256 _stock
    ) public onlyOwner {
        // Utwórz nowy przedmiot
        Item memory item = Item(
            _id,
            _name,
            _category,
            _image,
            _cost,
            _rating,
            _stock
        );

        // Dodaj przedmiot do mappingu
        items[_id] = item;

        // Emituj event List
        emit List(_name, _cost, _stock);
    }

    // Funkcja do zakupu przedmiotu
    function buy(uint256 _id) public payable {
        // Pobierz przedmiot z mappingu
        Item memory item = items[_id];

        // Sprawdź czy przesłano wystarczającą ilość ETH
        require(msg.value >= item.cost);

        // Sprawdź czy przedmiot jest dostępny w magazynie
        require(item.stock > 0);

        // Utwórz nowe zamówienie
        Order memory order = Order(block.timestamp, item);

        // Zwiększ licznik zamówień użytkownika
        orderCount[msg.sender]++; // <-- ID zamówienia
        // Dodaj zamówienie do mappingu
        orders[msg.sender][orderCount[msg.sender]] = order;

        // Zmniejsz ilość dostępnych sztuk przedmiotu
        items[_id].stock = item.stock - 1;

        // Emituj event Buy
        emit Buy(msg.sender, orderCount[msg.sender], item.id);
    }

    // Funkcja do wypłaty środków przez właściciela kontraktu
    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}