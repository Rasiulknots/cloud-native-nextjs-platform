import Link from "next/link";

interface Props {
    title: string;
    image: string;
}

const EventCard = ({ title, image }: Props) => {
  return (
    <Link href={`/events`} id="event-card">
        
    </Link>
  )
}

export default EventCard