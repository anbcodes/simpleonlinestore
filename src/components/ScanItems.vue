<template>
  <v-container>
    <v-row justify="center" class="title">
      Current Number: {{currentNumber}}
    </v-row>
    <br>
    <v-row style="max-height: 480px">
      <div ref="video" style="max-height: 480px; max-width: 640px;">
      </div>
    </v-row>
    <v-row>
      <v-list style="font-family: monospace;">
        <receipt-item
          v-for="item in receipt.items"
          :key="item.id"
          :item="item"
          @remove="receipt.remove(item)"
        />
        <v-list-item>
          <v-list-item-content>
            Total: {{formatter.formatPrice(total)}}
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-row>
    <v-row>
      <v-col cols="2">
        <v-btn block outlined :loading="printing" color="success" @click="print">
          Print receipt
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn block outlined color="success" @click="email">
          Email receipt
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn block outlined color="error" @click="cancel">
          Cancel
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import Table from '../util/Table';
import Scanner from '../util/Scanner';
import formatter from '../util/Formatter';
import Receipt from '../util/Receipt';
import Log from '../util/Log';

import ReceiptItem from './ReceiptItem.vue';

export default {
  components: {
    'receipt-item': ReceiptItem,
  },
  created() {
    window.addEventListener('keypress', (e) => {
      if (parseInt(e.key, 10)) {
        this.currentNumber = parseInt(e.key, 10);
      }
    });
  },
  data: () => ({
    currentItems: [],
    items: [],
    currentCallback: null,
    detectionInLastSecond: false,
    printing: false,
    receipt: {},
    currentNumber: 1,

    table: Table,
    formatter,
  }),
  computed: {
    total() {
      let total = 0;
      if (!this.receipt.items) {
        return [];
      }
      this.receipt.items.forEach((item) => {
        total += +item.price * item.number;
      });
      return total;
    },
  },
  methods: {
    async start() {
      this.items = await this.table.items;
      this.receipt = new Receipt();
      Scanner.onCode(code => this.onDetection(code));
      Scanner.start(this.$refs.video, 1000);
      Log(__filename, 'Started scanner', { items: this.items, receipt: this.receipt, Scanner });
    },
    onDetection(code) {
      if (!this.items
        .filter(item => item.barcodeId === code)[0]) {
        const errorSound = new Audio('data:audio/wav;base64,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');
        errorSound.play();
        Log(__filename, 'Item not found', { number: this.currentNumber, code });
        return;
      }
      const beep = new Audio('data:audio/wav;base64,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');
      beep.play();
      const itemFound = this.items.filter(item => item.barcodeId === code)[0];
      this.receipt
        .add(
          itemFound,
          this.currentNumber,
        );
      Log(__filename, 'Added item to receipt', { itemFound, number: this.currentNumber, code });
    },

    finish() {
      Log(__filename, 'Finishing Scanning');
      Scanner.stop();
      this.$emit('finish');
    },

    cancel() {
      Log(__filename, 'Canceling Scanning', { receipt: this.receipt });
      this.receipt = {};
      this.finish();
    },

    async print() {
      this.finish();
      this.printing = true;
      await this.receipt.print();
      this.printing = false;
      Log(__filename, 'Printed Receipt', { receipt: this.receipt });
    },

    email() {
      this.finish();
      const text = this.receipt.getEmailText();
      const link = document.createElement('a');
      let email = '';
      while (email === '' && email !== 'cancel') {
        email = window.prompt("Enter email or type 'cancel' to cancel");
      }
      if (email === 'cancel') {
        Log(__filename, 'Canceled emailing Receipt', {
          receipt: this.receipt, link, text, email,
        });
        return;
      }
      link.href = `mailto:${email}?subject=Receipt from ${localStorage.getItem('name') || ''}&body=${encodeURIComponent(text)}`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { link.remove(); }, 1000);
      Log(__filename, 'Emailed Receipt', {
        receipt: this.receipt, link, text, email,
      });
    },
  },
};
</script>
