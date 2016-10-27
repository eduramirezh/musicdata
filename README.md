
# Building a Serverless API with Chalice

This is a personal experiment I did to try out the [Chalice framework](https://github.com/awslabs/chalice).
It displays charts based on an artist's songs metadata, available through the Spotify API.

# Architecture

![Architecture diagram](/images/architecture.png)

The backend is built over Chalice, using AWS's API Gateway, Lambda and DynamoDB.
It loads the data of each song of a given artist from Spotify's API, and
stores it in a DynamoDB table, or loads it directly from the table if it was previously requested,
using this service as a cache.

The frontend was built using Google's Web Starter Kit. It makes AJAX requests to
the backend to get a specific artist's data.

