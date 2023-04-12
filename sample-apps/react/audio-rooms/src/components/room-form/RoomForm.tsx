import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { useState } from 'react';

function RoomForm(): JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const client = useStreamVideoClient();

  return (
    <section>
      <h2>Create a room</h2>
      <form action="">
        <label htmlFor="title">
          <span>Title</span>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label htmlFor="description">
          <span>Description</span>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <button type="submit" onClick={(event) => createButtonClicked(event)}>
          Create
        </button>
      </form>
    </section>
  );

  async function createButtonClicked(event: React.MouseEvent) {
    event.preventDefault();
    // const result = await client?.getOrCreateCall('demoAudioRoom1', 'default', {
    //   title: title,
    //   description: description,
    // });

    // console.log(`Result: ${JSON.stringify(result)}`);
  }
}

export default RoomForm;
