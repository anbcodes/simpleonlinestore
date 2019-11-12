import Database from './Database';
import Log from './Log';

export default {
  db: null,
  sortBy: null,
  sortUp: null,
  init(onUpdate) {
    this.onUpdate = onUpdate;
    this.db = new Database('WebShopTable', onUpdate);
    Log(__filename, 'Inited table', { db: this.db, onUpdate });
  },

  async erase() {
    Log(__filename, 'Erasing items');
    await this.db.erase();
  },

  get items() {
    Log(__filename, 'Getting items', {
      items: this.db.items,
      sorted: this.sortItems(this.db.items),
    });
    return this.sortItems(this.db.items);
  },

  async sortItems(itemsPromise) {
    const items = await itemsPromise;
    const originalItems = [...items];
    items.sort((a, b) => {
      if (a[this.sortBy] > b[this.sortBy]) {
        return this.sortUp ? 1 : -1;
      }

      if (a[this.sortBy] < b[this.sortBy]) {
        return this.sortUp ? -1 : 1;
      }

      return 0;
    });
    Log(__filename, 'Sorted Items', {
      items,
      originalItems,
      sortUp: this.sortUp,
      sortBy: this.sortBy,
    });
    return items;
  },

  async addItem(item) {
    const items = [...(await this.db.items)];
    const itemCopy = { ...item };
    const nextBarcodeId = Math.max(...items.map(v => v.barcodeId));
    itemCopy.barcodeId = nextBarcodeId === -Infinity ? 0 : nextBarcodeId;
    items.push(itemCopy);
    await (this.db.items = items);
    Log(__filename, 'Added Item', { items, itemCopy });
  },

  async removeItem(item) {
    let items = [...(await this.db.items)];
    delete items[items
      .map(v => v.barcodeId)
      .indexOf(item.barcodeId)
    ];
    items = items.filter(v => v);
    await (this.db.items = items);
    Log(__filename, 'Removed item', { item, items });
  },

  async editItem(item) {
    const items = [...(await this.db.items)];
    const index = items
      .map(v => v.barcodeId)
      .indexOf(item.barcodeId);
    if (index === -1) {
      Log(__filename, 'Item Not Found', {
        index, items, item,
      });
      return 'Item Not Found';
    }
    items[index] = item;
    items.filter(v => v);
    await (this.db.items = items);
    Log(__filename, 'Edited Item', {
      item,
      index,
      items,
    });
    return item;
  },

  async updateSort(name) {
    if (this.sortBy === name) {
      this.sortUp = !this.sortUp;
    } else {
      this.sortBy = name;
    }
    this.onUpdate(await this.items);
    Log(__filename, 'updated sort', {
      sortBy: this.sortBy,
      sortUp: this.sortUp,
      name,
    });
  },
};
