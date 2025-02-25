import React, { useEffect } from "react";
import { useChatStore } from './store/chatStore';
import { SearchConfigSchema } from '@chat-widget/utils';
import Chat from "./components/Chat";
import CustomTag from './components/CustomTag';

interface Destination {
  id: number;
  name: string;
  longDescription: string;
  description: string;
}

const dummyDestination: Destination[] = [
  {
    id: 4,
    name: "Paris, France",
    longDescription:
      "The City of Lights, Paris, is renowned for its art, cuisine, and historic landmarks. It is ideal for cultured travelers and fashion aficionados who relish café culture, museum visits, and chic boutique shopping. The blend of historic charm and modern sophistication infuses the city with an irresistible elegance.",
    description: "City of art and haute cuisine."
  }
];

const dummyDestinations: Destination[] = [
  {
    id: 1,
    name: "Bali, Indonesia",
    longDescription: 
      "Bali captivates with its mystical blend of ancient spirituality and raw natural beauty. Hidden waterfalls cascade through emerald jungles, while centuries-old temples stand guard over terraced rice fields that glow golden at sunset. Surfers chase world-class breaks at Uluwatu, while wellness seekers find solace in Ubud's meditation centers and organic cafes.\n\nLocal artisans keep traditional crafts alive in bustling workshops, creating intricate batik textiles and elaborate wood carvings. The island's soul reveals itself through nightly gamelan performances, colorful temple ceremonies, and the genuine warmth of its people. From the rugged black sand beaches of the north to the laid-back coastal villages of the east, each region offers its own distinct flavor of paradise.",
    description: "Tropical, serene beaches, vibrant culture."
  },
  {
    id: 2,
    name: "Maldives",
    longDescription:
      "The Maldives redefines exclusivity with its constellation of coral atolls scattered across the Indian Ocean like stars in the night sky. Each private island resort is a masterpiece of sustainable luxury, where overwater villas merge seamlessly with the crystal-clear lagoons below. The underwater realm here is unmatched - swim alongside gentle manta rays and kaleidoscopic fish in some of the world's most pristine coral gardens.\n\nBeyond the postcard-perfect scenes, the Maldives offers extraordinary experiences: dine in underwater restaurants, watch bioluminescent shores shimmer at night, or take a seaplane journey for a bird's eye view of these perfect coral circles in the azure sea. The combination of world-class hospitality and untouched natural splendor creates an escape that exists nowhere else on Earth.",
    description: "Luxurious, pristine islands."
  },
  {
    id: 3,
    name: "Santorini, Greece",
    longDescription:
      "Santorini rises dramatically from the Aegean Sea, its whitewashed architecture carved into volcanic cliffs that tell a story of ancient geological fury. The island's unique character stems from this volcanic heritage - black sand beaches contrast with red cliffs, while the caldera views serve as a backdrop to some of the Mediterranean's most innovative cuisine. Local chefs work with ingredients unique to the island's volcanic soil, including the famed white eggplants and cherry-sized tomatoes bursting with intensity.\n\nThe island's lesser-known treasures include ancient Akrotiri, a Pompeii-like city preserved in volcanic ash, and the traditional cave homes of Oia that have been transformed into artistic hideaways. Sample distinctive assyrtiko wines from vineyards where grapes grow in spiral-shaped baskets designed to protect them from strong winds, or explore hidden coves only accessible by traditional fishing boats.",
    description: "Stunning sunsets, romantic vistas."
  },
  {
    id: 4,
    name: "Paris, France",
    longDescription:
      "Paris defies expectations - beyond the Eiffel Tower lies a city of intimate moments and hidden treasures. Duck into centuries-old passages couverts to discover antiquarian bookshops and artisanal chocolatiers. Each arrondissement unfolds like a village, from the literary haunts of Saint-Germain to the artist ateliers of Montmartre.\n\nThe city rewards the curious - find locals playing pétanque along the Canal Saint-Martin, stumble upon jazz quartets in medieval cellars, or join Parisians for sunrise croissants at historic boulangeries. While tourists queue at the Louvre, savvy visitors explore the intimate Musée Carnavalet or watch restoration artists at work in Marais mansions. This is the Paris that locals cherish - a mosaic of small moments that reveal the city's true character.",
    description: "City of art and haute cuisine."
  },
  {
    id: 5,
    name: "Rome, Italy",
    longDescription:
      "Rome isn't frozen in time - it's a living collage where each era adds its own brushstroke. Locals treat 2000-year-old ruins as everyday shortcuts, while Michelin-starred chefs reinvent traditional cucina romana in converted Renaissance palazzos. The Testaccio district pulses with energy around its ancient Monte dei Cocci, a hill built entirely of Roman amphora shards.\n\nMornings begin with espresso at standing-room-only bars, where businesspeople and priests share counter space. By afternoon, neighbors debate politics in sun-drenched piazzas while artisans restore baroque fountains. As sunset gilds the city's dome-studded skyline, Romans gather for the time-honored aperitivo, transforming historic squares into open-air living rooms. This is a city that lives in the present while keeping one foot firmly planted in its legendary past.",
    description: "Ancient ruins with modern flair."
  },
  {
    id: 6,
    name: "Barcelona, Spain",
    longDescription:
      "Barcelona's true spirit lies in its defiance of convention - where else do modernist masterpieces sprout between medieval walls, or where fishermen's quarters transform into cutting-edge design hubs? Gaudí's works aren't just landmarks but manifestos in stone, challenging visitors to reimagine what architecture can be.\n\nThe city moves to its own rhythm: markets buzz at dawn as chefs haggle over just-caught seafood, afternoons stretch into long lunches in sun-dappled plaças, and evenings merge into night as experimental jazz spills from Gothic Quarter doorways. In Poblenou, former factories now house tech startups and art collectives, while the hills of Montjuïc guard secret gardens and Olympic legacy. This is a city that constantly reinvents itself while fiercely protecting its Catalan heart.",
    description: "Artistic, coastal vibrancy."
  },
  {
    id: 7,
    name: "New York City, USA",
    longDescription:
      "New York thrives on contradiction - where else do fortune 500 CEOs share subway cars with street artists, or Michelin-starred restaurants operate next to century-old pizza joints? Each neighborhood writes its own story: Chelsea's art galleries occupy former factories, while dumpling houses in Flushing serve recipes passed down through generations.\n\nThe city reveals itself in layers - discover speakeasies hidden behind laundromat doors, or rooftop farms atop industrial buildings in Brooklyn. Time moves differently here: dawn breaks over runners in Central Park, while late-night food trucks serve gourmet tacos to Broadway performers post-show. This isn't just a city of landmarks, but of countless small innovations and daily reinventions that keep its pulse racing.",
    description: "Energetic metropolis with iconic landmarks."
  },
  {
    id: 8,
    name: "Tokyo, Japan",
    longDescription:
      "Tokyo masters the art of contrast - ancient tea ceremonies unfold in shadows of soaring skyscrapers, while master sushi chefs maintain centuries-old traditions alongside robot-staffed cafes. The city operates with precision yet embraces the unexpected, from impromptu jazz sessions in tiny Shinjuku bars to seasonal art installations in corporate lobbies.\n\nEach district tells its own tale: Yanaka preserves the old Edo atmosphere with traditional craftsmen and cat-inhabited temples, while Shimokitazawa's vintage shops and independent music venues foster tomorrow's trends. In Kagurazaka, geisha still hurry along cobbled streets, while nearby Tokyo University researchers push the boundaries of technology. This metropolis doesn't just balance past and future - it shows how they can enrich each other.",
    description: "Futuristic and traditional blend."
  },
  {
    id: 9,
    name: "Sydney, Australia",
    longDescription:
      "Sydney's allure lies in its untamed spirit - where a world-class metropolis meets the raw beauty of nature. Hidden beaches tucked between sandstone cliffs await those who venture beyond Bondi, while Aboriginal rock art in Ku-ring-gai Chase National Park tells stories stretching back millennia. The city's outdoor lifestyle isn't just about surfing - locals debate politics in harborside ocean pools and conduct business meetings on coastal walking trails.\n\nCulinary innovation flourishes in converted industrial spaces in Chippendale, while Paddington's Victorian terraces house fashion innovators and design studios. Weekend mornings find locals in warehouse cafes in Alexandria, debating rugby scores over flat whites and indigenous-inspired breakfast dishes. This is a city that combines urban sophistication with sun-soaked irreverence.",
    description: "Harbor views, sunny beaches and vibrant streets."
  },
  {
    id: 10,
    name: "Cape Town, South Africa",
    longDescription:
      "Cape Town commands attention through dramatic contrasts - where an ancient mountain plunges into two oceans, and Dutch colonial architecture stands alongside vivid Cape Malay facades. The city's renaissance blooms in Woodstock's converted biscuit mills and Salt River's street art, while wine estates in Constantia maintain centuries-old traditions with modern sustainability practices.\n\nLocal life unfolds in unexpected ways - tech entrepreneurs brainstorm in converted Victorian warehouses, while urban farmers cultivate rooftop gardens with Table Mountain views. In Bo-Kaap, the call to prayer mingles with the aroma of Malay curry, and beach suburbs like Muizenberg attract surfers and artists to their colorful shores. This is a city of pioneers and storytellers, where every vista point reveals another facet of South Africa's evolving narrative.",
    description: "Breathtaking landscapes with urban culture."
  }
];

const tagExamples = [
  "Cape town has great beaches!",
  "Close to the UK!",
  "Known for great nature and adventure!"
];

const App: React.FC = () => {
  const { 
    searchData, 
    customerIntention, 
    syncSearchState,
    setSearchTrigger
  } = useChatStore();
  
  useEffect(() => {
    if (Object.keys(searchData).length > 0) {
      // Handle search data changes
    }
  }, [searchData]);

  useEffect(() => {
    if (Object.keys(customerIntention).length > 0) {
      // Handle intention changes
    }
  }, [customerIntention]);

  const handleUpdateSearchClick = () => {
    console.log('Updating search with data:', searchData);
    // Here you would typically trigger a search with the new data
  };

  // Test search config
  const testSearchConfig: SearchConfigSchema = {
    searchData: {
      location: {
        type: 'string',
        description: 'City or region to search in',
        required: true,
        example: 'Paris, France'
      },
      startDate: {
        type: 'string',
        description: 'Travel start date',
        required: true,
        format: 'YYYY-MM-DD',
        example: '2024-06-01'
      },
      endDate: {
        type: 'string',
        description: 'Travel end date',
        required: true,
        format: 'YYYY-MM-DD',
        example: '2024-06-07'
      }
    }
  };

  // Test search handler
  const handleTestSearch = () => {
    setTimeout(() => {
      const testSearchData = {
        location: 'Paris, France',
        startDate: '2024-06-01',
        endDate: '2024-06-07'
      };
      
      syncSearchState(testSearchData);
    }, 1500);
  };

  // Set up search trigger once
  useEffect(() => {
    setSearchTrigger(() => {
      handleUpdateSearchClick();
    });
  }, []);

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1>Header</h1>
      </header>
      <main style={styles.main}>
        <h2>Main Content Area</h2>
        <p>My name is goo and i want to transact.</p>
        <div>
          <h3>Search Data:</h3>
          <pre>{JSON.stringify(searchData, null, 2)}</pre>
          <h3>Customer Intention:</h3>
          <pre>{JSON.stringify(customerIntention, null, 2)}</pre>
        </div>
        <div>
          <button onClick={handleTestSearch}>
            Test Search: Paris
          </button>
        </div>
        <div style={styles.destinationsContainer}>
          <h1>Holiday Destinations</h1>
          <div style={styles.destinationsGrid}>
            {dummyDestinations.map((item) => (
              <div key={item.id} style={styles.destinationItem}>
                <h2>{item.name}</h2>
                <p>{item.longDescription}</p>
                <CustomTag
                  itemInformation={item}
                  name="locationTag"
                  instructions="create a short tag description highlighting key aspects of this location that match the customer's preferences. Keep it short and clipped. Don't pad it out like a full sentence."
                  textExamples={tagExamples}
                  strongMatchOnly={true}
                  backgroundColor="#1a2b3c"
                  borderColor="#b3d7ff"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Chat 
        searchConfig={testSearchConfig}
        requireManualSearch={true}
      />
      <footer style={styles.footer}>
        <p>Footer</p>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
  },
  header: {
    backgroundColor: '#f2f2f2',
    padding: '10px',
    textAlign: 'center',
  },
  main: {
    flex: 1,
    padding: '20px',
  },
  footer: {
    backgroundColor: '#f2f2f2',
    padding: '10px',
    textAlign: 'center',
  },
  destinationsContainer: {
    padding: '20px',
  },
  destinationsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
  },
  destinationItem: {
    flex: '1 0 300px',
    border: '1px solid #ccc',
    padding: '10px',
    borderRadius: '4px',
  },
};

export default App;