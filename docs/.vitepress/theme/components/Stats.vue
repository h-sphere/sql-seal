<script setup>
const stats = [
  {
    number: '2K+',
    label: 'Downloads',
    icon: '📥'
  },
  {
    number: '39+',
    label: 'Releases',
    icon: '📦'
  },
  {
    number: '51+',
    label: 'GitHub Stars',
    icon: '⭐'
  },
  {
    number: '48+',
    label: 'Discord Members',
    icon: '🤝'
  }
]
</script>

<template>
  <ClientOnly>
    <div class="stats">
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <span class="stat-icon" v-text="stat.icon" />
          <span class="stat-number" v-text="stat.number" />
          <span class="stat-label" v-text="stat.label" />
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.stats {
  margin: 3rem auto;
  padding: 0 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  max-width: 1152px;
  margin: 0 auto;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.stat-number {
  font-size: 2.25rem;
  font-weight: 600;
  color: var(--vp-c-brand);
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  text-align: center;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card {
    padding: 1.5rem;
  }
  
  .stat-number {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>