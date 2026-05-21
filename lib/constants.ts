export interface Event {
  title: string;
  image: string;
  slug: string;
  location: string;
  date: string;
  time: string;
}

export const events: Event[] = [
  {
    title: "Google I/O 2025",
    image: "/images/event1.png",
    slug: "google-io-2025",
    location: "Shoreline Amphitheatre, Mountain View, CA",
    date: "2025-05-20",
    time: "10:00 AM PDT",
  },
  {
    title: "AWS re:Invent 2025",
    image: "/images/event2.png",
    slug: "aws-reinvent-2025",
    location: "The Venetian, Las Vegas, NV",
    date: "2025-12-01",
    time: "09:00 AM PST",
  },
  {
    title: "GitHub Universe 2025",
    image: "/images/event3.png",
    slug: "github-universe-2025",
    location: "Bill Graham Civic Auditorium, San Francisco, CA",
    date: "2025-10-28",
    time: "09:30 AM PDT",
  },
  {
    title: "React Summit 2025",
    image: "/images/event4.png",
    slug: "react-summit-2025",
    location: "Amsterdam, Netherlands",
    date: "2025-06-13",
    time: "09:00 AM CEST",
  },
  {
    title: "Next.js Conf 2025",
    image: "/images/event5.png",
    slug: "nextjs-conf-2025",
    location: "Online + San Francisco, CA",
    date: "2025-10-23",
    time: "10:00 AM PDT",
  },
  {
    title: "KubeCon North America 2025",
    image: "/images/event6.png",
    slug: "kubecon-na-2025",
    location: "Georgia World Congress Center, Atlanta, GA",
    date: "2025-11-18",
    time: "08:30 AM EST",
  },
];
