<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Prakiraan Suhu per Jam — Jakarta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="container">
        <ion-button @click="ambilData" :disabled="loading">
          {{ loading ? 'Memuat…' : 'Ambil Data' }}
        </ion-button>

        <p v-if="error" class="error">{{ error }}</p>

        <div v-if="weatherData" class="weather-info">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Informasi Lokasi</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p><strong>Latitude:</strong> {{ weatherData.latitude }}</p>
              <p><strong>Longitude:</strong> {{ weatherData.longitude }}</p>
              <p><strong>Timezone:</strong> {{ weatherData.timezone }}</p>
              <p><strong>Elevation:</strong> {{ weatherData.elevation }} m</p>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Suhu Saat Ini</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p class="current-temp">{{ currentTemp }}°C</p>
              <p>Waktu: {{ currentTime }}</p>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Ringkasan Hari Ini</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p><strong>Suhu Min:</strong> {{ todayMin }}°C</p>
              <p><strong>Suhu Max:</strong> {{ todayMax }}°C</p>
              <p><strong>Rata-rata:</strong> {{ todayAvg }}°C</p>
            </ion-card-content>
          </ion-card>
        </div>

        <ion-card v-if="rows.length">
          <ion-card-header>
            <ion-card-title>Prakiraan Suhu per Jam</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Suhu (°C)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in rows" :key="i">
                  <td>{{ r.timeLocal }}</td>
                  <td>{{ r.temperature }}</td>
                </tr>
              </tbody>
            </table>
          </ion-card-content>
        </ion-card>

        <p v-else-if="!loading">Klik "Ambil Data" untuk memuat data suhu.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/vue';
import EndPointAccess from '@/services/EndPointAccess';

type OpenMeteoHourly = {
  time: string[];
  temperature_2m: number[];
};

type OpenMeteoRes = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: OpenMeteoHourly;
};

export default defineComponent({
  name: 'WeatherHome',
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  },
  data() {
    return {
      weatherData: null as OpenMeteoRes | null,
      rows: [] as Array<{
        timeISO: string;
        timeLocal: string;
        temperature: number;
      }>,
      loading: false,
      error: '',
      currentTemp: 0,
      currentTime: '',
      todayMin: 0,
      todayMax: 0,
      todayAvg: 0,
    };
  },
  methods: {
    async ambilData() {
      this.loading = true;
      this.error = '';
      this.rows = [];
      this.weatherData = null;

      try {
        const url =
          'https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&hourly=temperature_2m';

        const client = new EndPointAccess(url);
        const res = await client.getRes<OpenMeteoRes>();

        this.weatherData = res.data;

        const hourly = res.data.hourly;
        if (!hourly || !hourly.time || !hourly.temperature_2m) {
          this.error = 'Struktur data tidak sesuai.';
          return;
        }

        const tz = 'Asia/Jakarta';
        const fmt = new Intl.DateTimeFormat('id-ID', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });

        this.rows = hourly.time.map((t, idx) => {
          const temperature = hourly.temperature_2m[idx];
          const timeLocal = fmt.format(new Date(t));
          return { timeISO: t, timeLocal, temperature };
        });

        // Hitung suhu saat ini (terdekat dengan waktu sekarang)
        const now = new Date();
        const currentIndex = this.rows.findIndex(
          (r) => new Date(r.timeISO) >= now
        );
        if (currentIndex >= 0) {
          this.currentTemp = this.rows[currentIndex].temperature;
          this.currentTime = this.rows[currentIndex].timeLocal;
        }

        // Hitung ringkasan hari ini
        const today = new Date().toISOString().split('T')[0];
        const todayTemps = this.rows
          .filter((r) => r.timeISO.startsWith(today))
          .map((r) => r.temperature);
        if (todayTemps.length > 0) {
          this.todayMin = Math.min(...todayTemps);
          this.todayMax = Math.max(...todayTemps);
          this.todayAvg =
            Math.round(
              (todayTemps.reduce((a, b) => a + b, 0) / todayTemps.length) * 10
            ) / 10;
        }
      } catch (e: any) {
        this.error = 'Gagal memuat data. Periksa koneksi internet.';
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
.container {
  padding: 16px;
}
.error {
  color: #e74c3c;
  margin: 8px 0;
}
.weather-info {
  margin-bottom: 16px;
}
.current-temp {
  font-size: 2em;
  font-weight: bold;
  color: #007bff;
}
</style>
