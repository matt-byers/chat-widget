import React, { useEffect } from "react";
import Chat from "./Chat";
import { useChatStore } from './store/chatStore';
import { SearchConfigSchema } from '@chat-widget/utils';
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
      "Bali is a tropical paradise known for its forested volcanic mountains, iconic rice paddies, and pristine beaches. It appeals to travelers seeking a blend of relaxation and adventure, with opportunities for yoga retreats, surfing, and exploring vibrant local ceremonies. The island's lush landscapes and spiritual essence offer a rejuvenating escape for creative souls.\n\nBeyond its natural beauty, Bali boasts a rich cultural heritage evident in its numerous temples, traditional dance performances, and artisanal crafts. Visitors can immerse themselves in the local way of life by participating in community festivals, enjoying authentic Balinese cuisine, and exploring bustling markets that showcase the island's unique blend of tradition and modernity.",
    description: "Tropical, serene beaches, vibrant culture."
  },
  {
    id: 2,
    name: "Maldives",
    longDescription:
      "The Maldives, celebrated for its clear turquoise waters and overwater bungalows, is a top luxury destination. It caters to honeymooners and discerning travelers seeking an exclusive retreat, with exceptional diving and world-class service. Its serene lagoons and high-end resorts exude a lavish yet intimate charm.\n\nApart from its underwater wonders, the Maldives offers pristine white-sand beaches, exquisite spa experiences, and gourmet dining options that elevate any vacation. Guests can indulge in water sports such as snorkeling, kayaking, and paddleboarding, or simply relax under the shade of palm trees while enjoying breathtaking sunsets over the Indian Ocean.",
    description: "Luxurious, pristine islands."
  },
  {
    id: 3,
    name: "Santorini, Greece",
    longDescription:
      "Santorini is famous for its white-washed houses and blue-domed churches overlooking a sparkling caldera. This island attracts romantic souls and art enthusiasts with its dramatic sunsets and classic Aegean architecture. Its charming streets and rich culinary scene create an atmosphere of timeless beauty and relaxed sophistication.\n\nIn addition to its picturesque landscapes, Santorini offers a variety of cultural experiences, including ancient archaeological sites, local wineries producing exquisite wines, and vibrant art galleries showcasing contemporary and traditional works. Visitors can explore hidden beaches with unique volcanic sands or dine in cliffside restaurants offering panoramic views of the sea.",
    description: "Stunning sunsets, romantic vistas."
  },
  {
    id: 4,
    name: "Paris, France",
    longDescription:
      "The City of Lights, Paris, is renowned for its art, cuisine, and historic landmarks. It is ideal for cultured travelers and fashion aficionados who relish café culture, museum visits, and chic boutique shopping. The blend of historic charm and modern sophistication infuses the city with an irresistible elegance.\n\nBeyond its iconic attractions like the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral, Paris offers an array of experiences from leisurely strolls along the Seine River to exploring vibrant neighborhoods filled with eclectic shops and gourmet restaurants. The city's rich history is palpable in its stunning architecture, engaging literature, and world-class theater performances, making every visit a captivating journey through time and culture.",
    description: "City of art and haute cuisine."
  },
  {
    id: 5,
    name: "Rome, Italy",
    longDescription:
      "Rome seamlessly blends ancient history with modern vibrancy, showcasing magnificent ruins alongside bustling piazzas. It enchants history buffs and romantics with its timeless fountains, exquisite architecture, and gourmet trattorias. The city's dynamic energy and storied past spark a sense of discovery and wonder in every visitor.\n\nIn addition to its historical treasures like the Colosseum, Roman Forum, and Vatican City, Rome offers a lively culinary scene where traditional Italian flavors meet contemporary innovations. Visitors can enjoy authentic gelato while exploring charming cobblestone streets, relax in beautiful parks like Villa Borghese, or experience the vibrant nightlife that brings the Eternal City to life after dark.",
    description: "Ancient ruins with modern flair."
  },
  {
    id: 6,
    name: "Barcelona, Spain",
    longDescription:
      "Barcelona offers a spirited blend of coastal living and innovative art, highlighted by Gaudí's architectural masterpieces. It draws creative minds and young adventurers who enjoy lively festivals, tapas evenings, and vibrant street performances. The city's modernist designs mingle with Mediterranean relaxation to create a uniquely captivating atmosphere.\n\nBeyond its architectural wonders like the Sagrada Família and Park Güell, Barcelona boasts beautiful beaches, bustling markets such as La Boqueria, and a rich cultural heritage reflected in its museums and theaters. Visitors can immerse themselves in the local lifestyle by enjoying leisurely walks along Las Ramblas, savoring delicious Catalan cuisine, and participating in the city's renowned nightlife.",
    description: "Artistic, coastal vibrancy."
  },
  {
    id: 7,
    name: "New York City, USA",
    longDescription:
      "New York City, the metropolis that never sleeps, is a dazzling showcase of iconic skyscrapers, Broadway dramas, and diverse cultural neighborhoods. Perfect for urban explorers and ambitious go-getters, the city pulses with energy from world-class dining to avant-garde art. Its ever-changing skyline and dynamic spirit encapsulate the essence of modern America.\n\nIn addition to its renowned landmarks like Times Square, Central Park, and the Statue of Liberty, New York offers a plethora of experiences from exploring eclectic neighborhoods like Soho and Harlem to indulging in its vibrant arts scene. Visitors can enjoy panoramic views from observation decks, attend live performances, or discover hidden gems in the city's countless museums and galleries.",
    description: "Energetic metropolis with iconic landmarks."
  },
  {
    id: 8,
    name: "Tokyo, Japan",
    longDescription:
      "Tokyo is a brilliant juxtaposition of futuristic modernity and timeless tradition, featuring sleek skyscrapers alongside serene temples. It appeals to tech enthusiasts and cultural explorers alike with its cutting-edge gadgets, exquisite cuisine, and historical shrines. The city's neon-lit streets and tranquil gardens create an unforgettable contrast that captures the heart of Japan.\n\nBeyond its bustling districts like Shibuya and Shinjuku, Tokyo offers peaceful escapes in areas like Asakusa and Ueno Park. Visitors can experience the meticulous craftsmanship of traditional arts, enjoy world-class shopping in upscale malls and quirky boutiques, or savor a diverse culinary scene that ranges from Michelin-starred restaurants to unique street food stalls.",
    description: "Futuristic and traditional blend."
  },
  {
    id: 9,
    name: "Sydney, Australia",
    longDescription:
      "Sydney is celebrated for its sparkling harbor, breathtaking beaches, and dynamic urban culture. Adventure seekers and beach lovers can enjoy surfing, coastal hikes, and vibrant dining scenes. The city's iconic landmarks and relaxed yet cosmopolitan feel perfectly balance nature and modernity.\n\nIn addition to the famous Sydney Opera House and Harbour Bridge, the city offers a range of cultural experiences including art galleries, live music venues, and museums. Visitors can explore charming neighborhoods like The Rocks, indulge in fresh seafood at harbor-side restaurants, or take leisurely walks through beautiful parks and botanical gardens that showcase Sydney's natural beauty.",
    description: "Harbor views, sunny beaches and vibrant streets."
  },
  {
    id: 10,
    name: "Cape Town, South Africa",
    longDescription:
      "Cape Town features a dramatic landscape where rugged mountains meet sparkling coastlines, anchored by the majestic Table Mountain. It attracts adventurous travelers and culture enthusiasts with its outdoor activities, rich history, and artistic flair. The interplay of natural beauty, urban sophistication, and intriguing local traditions gives the city its captivating je ne sais quoi.\n\nBeyond its stunning vistas, Cape Town offers a vibrant cultural scene with diverse communities, bustling markets, and a thriving art scene. Visitors can explore the historic Robben Island, enjoy wine tasting in nearby vineyards, or relax on pristine beaches. The city's commitment to sustainability and conservation is evident in its numerous parks and nature reserves, providing ample opportunities for eco-friendly tourism.",
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